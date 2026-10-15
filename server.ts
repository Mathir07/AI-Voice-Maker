import { GoogleGenAI } from "@google/genai";
import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "50mb" }));

// In-memory cache to save quota across requests
const audioCache = new Map<string, { buffer: Buffer; timestamp: number }>();

function getCacheKey(text: string, voice: string, style?: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(`${voice}::${style || ""}::${text.trim()}`);
  return hash.digest("hex");
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function parseRetryDelay(err: any): number {
  try {
    const raw = typeof err === "string" ? err : err.message || JSON.stringify(err);
    const match = raw.match(/retry in ([0-9.]+)s/i) || raw.match(/retryDelay"?:\s*"([0-9]+)s?"/i);
    if (match) {
      return Math.ceil(parseFloat(match[1]));
    }
  } catch (_) {}
  return 50;
}

function isRateLimitError(err: any): boolean {
  const msg = typeof err === "string" ? err : err.message || JSON.stringify(err);
  return (
    err?.status === 429 ||
    err?.code === 429 ||
    msg.includes("429") ||
    msg.includes("Quota exceeded") ||
    msg.includes("RESOURCE_EXHAUSTED")
  );
}

/**
 * Call Gemini TTS to synthesize text with single call and caching
 */
async function synthesizeTts(
  ai: GoogleGenAI,
  text: string,
  voice: string,
  stylePrompt?: string
): Promise<Buffer> {
  const chosenVoice = voice || "Fenrir";
  const defaultStyle =
    "Deep, mature male narrator. Dark, cinematic, suspenseful storytelling style. Clear natural English, neutral international accent, slow steady pace, dramatic pauses between sentences. No background music or sound effects, only clean narrator voice.";

  const effectiveStyle = stylePrompt ? `${defaultStyle} ${stylePrompt}` : defaultStyle;
  const cacheKey = getCacheKey(text, chosenVoice, effectiveStyle);

  // Return from memory cache if available
  const cached = audioCache.get(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] Serving cached audio for key ${cacheKey.slice(0, 8)}`);
    return cached.buffer;
  }

  const requestConfig = {
    responseModalities: ["AUDIO"],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: chosenVoice },
      },
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: text.trim(),
              speechMetadata: {
                style: effectiveStyle,
              },
            },
          ],
        },
      ],
      config: requestConfig,
    });

    const base64Data =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Data) {
      throw new Error("No audio data returned by Gemini TTS");
    }
    const buf = Buffer.from(base64Data, "base64");
    audioCache.set(cacheKey, { buffer: buf, timestamp: Date.now() });
    return buf;
  } catch (err: any) {
    // If rate limited, throw immediately so client can display accurate countdown
    if (isRateLimitError(err)) {
      const waitSec = parseRetryDelay(err);
      const customErr: any = new Error(
        `Gemini API free tier rate limit reached (3 requests/min). Please retry in ${waitSec} seconds.`
      );
      customErr.isRateLimit = true;
      customErr.retryAfterSecs = waitSec;
      throw customErr;
    }

    // Try fallback model only if not rate limited
    console.warn("Attempting fallback to gemini-3.8-flash-tts:", err.message);
    const fallbackResponse = await ai.models.generateContent({
      model: "gemini-3.8-flash-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: text.trim(),
              speechMetadata: {
                style: effectiveStyle,
              },
            },
          ],
        },
      ],
      config: requestConfig,
    });

    const base64Data =
      fallbackResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Data) {
      throw new Error("Fallback Gemini TTS also returned no audio data");
    }
    const buf = Buffer.from(base64Data, "base64");
    audioCache.set(cacheKey, { buffer: buf, timestamp: Date.now() });
    return buf;
  }
}

// Single segment TTS endpoint (Audition scene)
app.post("/api/tts/generate", async (req: Request, res: Response) => {
  try {
    const { text, voice, stylePrompt } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Text is required for narration." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not configured.",
      });
    }

    const wavBuffer = await synthesizeTts(ai, text, voice, stylePrompt);
    const audioBase64 = wavBuffer.toString("base64");

    return res.json({
      success: true,
      audioBase64,
      mimeType: "audio/wav",
      byteLength: wavBuffer.length,
    });
  } catch (error: any) {
    console.error("Error in /api/tts/generate:", error.message);
    if (error.isRateLimit) {
      return res.status(429).json({
        error: error.message,
        isRateLimit: true,
        retryAfterSecs: error.retryAfterSecs,
      });
    }
    return res.status(500).json({
      error: error.message || "Failed to generate voice narration",
    });
  }
});

/**
 * Master Episode Generation Endpoint:
 * CRITICAL FIX: Generates the ENTIRE episode in ONE SINGLE Gemini TTS API call.
 * This completely avoids the Free Tier rate limit (limit: 3 requests/min).
 */
app.post("/api/tts/generate-episode", async (req: Request, res: Response) => {
  try {
    const { scenes, voice } = req.body;
    if (!Array.isArray(scenes) || scenes.length === 0) {
      return res.status(400).json({ error: "Scenes array is required." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not configured.",
      });
    }

    // Assemble the full narrative script into a single cohesive story with natural dramatic pauses
    const validScenes = scenes.filter((s) => s.text && s.text.trim().length > 0);
    if (validScenes.length === 0) {
      return res.status(400).json({ error: "No non-empty text found in scenes." });
    }

    const combinedScript = validScenes
      .map((s) => s.text.trim())
      .join("\n\n... ... ...\n\n");

    const masterStyle =
      "Deep, mature male narrator. Dark, cinematic, suspenseful movie trailer and documentary style. Begin calmly and mysteriously while describing the forest and nature. Gradually build tension. Sound darker and more intense when describing the contaminated meat and the five-minute zombie transformation. Create a feeling of mystery and uneasiness when arriving home. Increase urgency, fear, and intensity during the morning panic and zombie chase. Deliver the final lines with strong suspense, ending with a dramatic pause before saying 'To be continued.' Clean studio narration only, no background music or sound effects.";

    // Single unary call - consumes only 1 request quota!
    const masterWavBuffer = await synthesizeTts(ai, combinedScript, voice || "Fenrir", masterStyle);
    const masterBase64 = masterWavBuffer.toString("base64");

    return res.json({
      success: true,
      masterAudioBase64: masterBase64,
      masterByteLength: masterWavBuffer.length,
      mimeType: "audio/wav",
      singleCall: true,
    });
  } catch (error: any) {
    console.error("Error in /api/tts/generate-episode:", error.message);
    if (error.isRateLimit) {
      return res.status(429).json({
        error: error.message,
        isRateLimit: true,
        retryAfterSecs: error.retryAfterSecs,
      });
    }
    return res.status(500).json({
      error: error.message || "Failed to generate episode narration",
    });
  }
});

// App server & Vite integration
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Zombie Apocalypse Studio] Server running on port ${PORT}`);
  });
}

startServer();
