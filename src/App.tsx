/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  DEFAULT_SCENES,
  DEFAULT_EPISODE_TITLE,
  SceneScript,
} from "./data/defaultScript";
import { StudioConsole } from "./components/StudioConsole";
import { VoiceSelector } from "./components/VoiceSelector";
import { ScriptEditor } from "./components/ScriptEditor";
import {
  Skull,
  Radio,
  FileCheck,
  Download,
  AlertCircle,
  Copy,
  CheckCircle,
  Sliders,
  Sparkles,
  Info,
  Youtube,
  Tv,
} from "lucide-react";

export default function App() {
  const [scenes, setScenes] = useState<SceneScript[]>(DEFAULT_SCENES);
  const [selectedVoice, setSelectedVoice] = useState<string>("Fenrir");
  const [pacing, setPacing] = useState<number>(0.92);
  const [pauseBetweenMs, setPauseBetweenMs] = useState<number>(800);

  // Audio state
  const [masterAudioBase64, setMasterAudioBase64] = useState<string | null>(null);
  const [currentAudioBase64, setCurrentAudioBase64] = useState<string | null>(null);
  const [currentAudioLabel, setCurrentAudioLabel] = useState<string>("Episode 1 Master Narration");
  const [activePlayingSceneId, setActivePlayingSceneId] = useState<string | null>(null);

  // Loading states
  const [isGeneratingMaster, setIsGeneratingMaster] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedChapters, setCopiedChapters] = useState(false);

  // Rate limit cooldown countdown
  const [cooldownSecs, setCooldownSecs] = useState<number>(0);

  // Countdown timer effect
  React.useEffect(() => {
    if (cooldownSecs <= 0) return;
    const interval = setInterval(() => {
      setCooldownSecs((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSecs]);

  // Reset to original script
  const handleResetScenes = () => {
    setScenes(DEFAULT_SCENES);
  };

  // Browser speech preview fallback when rate-limited
  const handleBrowserSpeechPreview = () => {
    if (!window.speechSynthesis) {
      alert("Speech synthesis is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();

    const fullScript = scenes.map((s) => s.text).join(" ... ");
    const utterance = new SpeechSynthesisUtterance(fullScript);
    const voices = window.speechSynthesis.getVoices();
    // Prefer deep English voice
    const deepVoice =
      voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Male") || v.name.includes("David") || v.name.includes("George") || v.name.includes("Daniel"))) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0];
    if (deepVoice) utterance.voice = deepVoice;
    utterance.pitch = 0.75; // Deeper pitch
    utterance.rate = pacing;

    window.speechSynthesis.speak(utterance);
    setCurrentAudioLabel(`Browser Narration Preview (Zero Quota)`);
    setErrorMessage(null);
  };

  // Generate Master Episode Narration (All Scenes in 1 Single API Call)
  const handleGenerateMaster = async () => {
    if (cooldownSecs > 0) return;
    setIsGeneratingMaster(true);
    setErrorMessage(null);
    setGenerationStep("Contacting Gemini TTS Engine (Single Episode Call)...");

    try {
      setGenerationStep("Synthesizing Episode 1 Narration...");

      const response = await fetch("/api/tts/generate-episode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenes: scenes.map((s) => ({
            id: s.id,
            text: s.text,
            stylePrompt: s.stylePrompt,
          })),
          voice: selectedVoice,
          pauseBetweenMs,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        if (response.status === 429 || data.isRateLimit) {
          const waitTime = data.retryAfterSecs || 50;
          setCooldownSecs(waitTime);
          throw new Error(
            `Gemini Free Tier rate limit reached (3 requests/minute). Please wait ${waitTime} seconds, or click 'Browser Audio Preview' to audition immediately.`
          );
        }
        throw new Error(data.error || "Failed to generate episode narration audio.");
      }

      setMasterAudioBase64(data.masterAudioBase64);
      setCurrentAudioBase64(data.masterAudioBase64);
      setCurrentAudioLabel(`Full Master Episode (Voice: ${selectedVoice})`);
      setActivePlayingSceneId(null);
    } catch (err: any) {
      console.error("Master generation failed:", err);
      setErrorMessage(err.message || "Generation failed.");
    } finally {
      setIsGeneratingMaster(false);
      setGenerationStep("");
    }
  };

  // Generate single scene audition
  const handleGenerateSingleScene = async (scene: SceneScript) => {
    setGeneratingSceneId(scene.id);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: scene.text,
          voice: selectedVoice,
          stylePrompt: scene.stylePrompt,
          sceneId: scene.id,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        if (response.status === 429 || data.isRateLimit) {
          const waitTime = data.retryAfterSecs || 50;
          setCooldownSecs(waitTime);
          throw new Error(
            `Gemini Free Tier rate limit reached (3 requests/minute). Please wait ${waitTime} seconds, or click 'Browser Audio Preview'.`
          );
        }
        throw new Error(data.error || "Failed to generate scene narration audio.");
      }

      setCurrentAudioBase64(data.audioBase64);
      setCurrentAudioLabel(`${scene.title} (Audition)`);
      setActivePlayingSceneId(scene.id);
    } catch (err: any) {
      console.error("Scene generation failed:", err);
      setErrorMessage(
        err.message || "Failed to generate scene audio. Please try again."
      );
    } finally {
      setGeneratingSceneId(null);
    }
  };

  // Copy YouTube timestamps & chapter markers
  const copyYouTubeChapters = () => {
    let runningSecs = 0;
    const lines = scenes.map((s) => {
      const mins = Math.floor(runningSecs / 60);
      const secs = Math.floor(runningSecs % 60);
      const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      const words = s.text.trim().split(/\s+/).filter(Boolean).length;
      runningSecs += Math.round(words / 2.3) + pauseBetweenMs / 1000;
      return `${timeStr} - ${s.title} (${s.mood})`;
    });

    const description = `🧟 ${DEFAULT_EPISODE_TITLE}\n\nEpisode Narration & Timestamps:\n${lines.join(
      "\n"
    )}\n\nVoice: ${selectedVoice} (Deep Cinematic Male Narrator)\nPacing: ${pacing}x Trailer Delivery\nAudio Stem: 24kHz Studio Master (Clean Speech, No Music/SFX)`;

    navigator.clipboard.writeText(description);
    setCopiedChapters(true);
    setTimeout(() => setCopiedChapters(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#08090c] text-zinc-100 flex flex-col selection:bg-red-900 selection:text-red-100">
      {/* Cinematic Header */}
      <header className="border-b border-zinc-800/80 bg-[#0d0f16]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-700 to-rose-950 border border-red-500/40 flex items-center justify-center shadow-[0_0_20px_-3px_rgba(220,38,38,0.5)]">
              <Skull className="w-5 h-5 text-red-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-cinematic text-sm sm:text-base font-extrabold tracking-wider text-red-500 uppercase">
                  Zombie Apocalypse
                </span>
                <span className="text-zinc-600 font-mono text-xs">•</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                  Episode 1: The Beginning of the End
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Studio-Grade Voice Narration for YouTube Series & Graphic Novels
              </p>
            </div>
          </div>

          {/* Quick Specifications Tag Pill List */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Deep Male Voice</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-300 font-mono">
              <Radio className="w-3 h-3 text-red-400" />
              <span>Clean Voice Stem (No SFX/BGM)</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-300 font-mono">
              <FileCheck className="w-3 h-3 text-amber-400" />
              <span>Verbatim Script Safe</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error / Rate limit banner if present */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-700/80 text-red-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5 flex items-center gap-2">
                  <span>Narration Notice</span>
                  {cooldownSecs > 0 && (
                    <span className="px-2 py-0.5 rounded bg-amber-900/80 text-amber-200 border border-amber-600 font-mono text-[10px]">
                      Cooldown: {cooldownSecs}s remaining
                    </span>
                  )}
                </p>
                <p>{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={handleBrowserSpeechPreview}
                className="px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-700/70 text-amber-200 font-medium text-xs transition-colors cursor-pointer"
              >
                Audition Browser Voice (0 Quota)
              </button>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-200 underline font-mono text-[11px] cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Master Audio Console */}
        <StudioConsole
          masterAudioBase64={masterAudioBase64}
          currentAudioBase64={currentAudioBase64}
          currentAudioLabel={currentAudioLabel}
          isGeneratingMaster={isGeneratingMaster}
          generationStep={generationStep}
          onGenerateMaster={handleGenerateMaster}
          selectedVoice={selectedVoice}
          pacing={pacing}
          scenes={scenes}
          cooldownSecs={cooldownSecs}
          onBrowserPreview={handleBrowserSpeechPreview}
        />

        {/* Studio Setup Grid: Voice Selector & Script Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Voice Models & Audio Engine Config (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <VoiceSelector
              selectedVoice={selectedVoice}
              onSelectVoice={setSelectedVoice}
              pacing={pacing}
              onChangePacing={setPacing}
              pauseBetweenMs={pauseBetweenMs}
              onChangePause={setPauseBetweenMs}
            />

            {/* YouTube Creator Production Toolbox */}
            <div className="bg-[#12151e]/90 border border-zinc-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-800 text-xs font-semibold text-zinc-200 uppercase font-cinematic">
                <Youtube className="w-4 h-4 text-red-500" />
                <span>YouTube Creator Export Kit</span>
              </div>
              <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                Copy formatted chapter timestamps and video description for your YouTube video upload:
              </p>
              <button
                type="button"
                onClick={copyYouTubeChapters}
                className="w-full py-2 px-3 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedChapters ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Description & Timestamps Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-red-400" />
                    <span>Copy YouTube Description & Chapters</span>
                  </>
                )}
              </button>

              <div className="mt-4 p-3 rounded-xl bg-[#090b10] border border-zinc-800/60 text-[11px] text-zinc-400 space-y-1.5">
                <div className="flex justify-between font-mono">
                  <span className="text-zinc-500">Audio Format:</span>
                  <span className="text-zinc-300">WAV (RIFF Header)</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-zinc-500">Sample Rate:</span>
                  <span className="text-zinc-300">24,000 Hz Mono</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-zinc-500">Bit Depth:</span>
                  <span className="text-zinc-300">16-bit Linear PCM</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-zinc-500">Atmosphere:</span>
                  <span className="text-zinc-300">Dark Movie Trailer</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-zinc-500">Isolation:</span>
                  <span className="text-emerald-400 font-semibold">100% Clean Voice Stem</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Story Script Editor & Scene Beats (8 cols) */}
          <div className="lg:col-span-8">
            <ScriptEditor
              scenes={scenes}
              onUpdateScenes={setScenes}
              onResetScenes={handleResetScenes}
              onGenerateSingleScene={handleGenerateSingleScene}
              generatingSceneId={generatingSceneId}
              activePlayingSceneId={activePlayingSceneId}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#07080b] py-4 text-center text-xs text-zinc-500 font-mono">
        <p>
          Zombie Apocalypse YouTube Voice Narration Studio • Built for high-stakes cinematic storytelling
        </p>
      </footer>
    </div>
  );
}
