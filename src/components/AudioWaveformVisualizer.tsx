import React, { useEffect, useRef } from "react";
import { Activity } from "lucide-react";

interface AudioWaveformVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  hasAudio: boolean;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  audioRef,
  isPlaying,
  hasAudio,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const setupAudioContext = () => {
      if (audioCtxRef.current) return;
      try {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.85;

        // Cross-origin check / safe connect
        const source = ctx.createMediaElementSource(audioEl);
        source.connect(analyser);
        analyser.connect(ctx.destination);

        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        sourceRef.current = source;
      } catch (e) {
        console.warn("AudioContext setup fallback or already connected", e);
      }
    };

    const handlePlay = () => {
      setupAudioContext();
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    };

    audioEl.addEventListener("play", handlePlay);
    return () => {
      audioEl.removeEventListener("play", handlePlay);
    };
  }, [audioRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;

      // Dark cinematic canvas background
      ctx.fillStyle = "#0c0e14";
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid lines
      ctx.strokeStyle = "rgba(40, 45, 60, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += 30) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += 20) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Centerline
      ctx.strokeStyle = "rgba(239, 68, 68, 0.25)";
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (analyserRef.current && isPlaying) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 2.2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * (height / 2);

          // Glowing crimson/amber gradient
          const gradient = ctx.createLinearGradient(0, height / 2 - barHeight, 0, height / 2 + barHeight);
          gradient.addColorStop(0, "rgba(239, 68, 68, 0.9)");
          gradient.addColorStop(0.5, "rgba(185, 28, 28, 0.8)");
          gradient.addColorStop(1, "rgba(245, 158, 11, 0.4)");

          ctx.fillStyle = gradient;
          ctx.fillRect(x, height / 2 - barHeight, barWidth - 1, barHeight * 2);

          x += barWidth;
        }
      } else if (isPlaying) {
        // Simulated organic waveform when direct analyser isn't hooked yet
        phase += 0.08;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(220, 38, 38, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "rgba(220, 38, 38, 0.8)";
        ctx.shadowBlur = 10;

        for (let x = 0; x < width; x++) {
          const normX = x / width;
          const amp = Math.sin(normX * Math.PI) * 26;
          const y =
            height / 2 +
            Math.sin(normX * 18 + phase) * amp * 0.7 +
            Math.cos(normX * 8 - phase * 1.5) * (amp * 0.4);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Resting ambient pulse
        phase += 0.02;
        ctx.beginPath();
        ctx.strokeStyle = hasAudio ? "rgba(220, 38, 38, 0.4)" : "rgba(100, 116, 139, 0.3)";
        ctx.lineWidth = 1.5;

        for (let x = 0; x < width; x++) {
          const normX = x / width;
          const amp = hasAudio ? 8 : 2;
          const y = height / 2 + Math.sin(normX * 10 + phase) * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, hasAudio]);

  return (
    <div className="relative w-full rounded-xl border border-red-950/60 bg-[#0c0e14] p-3 shadow-inner overflow-hidden">
      <div className="flex items-center justify-between mb-2 px-1 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Activity className={`w-3.5 h-3.5 ${isPlaying ? "text-red-500 animate-pulse" : "text-zinc-600"}`} />
          <span className="font-mono uppercase tracking-wider text-[11px] font-medium text-zinc-300">
            {isPlaying ? "Live Studio Audio Stream" : hasAudio ? "Audio Master Ready" : "Awaiting Generation"}
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-500">
          <span>24kHz • MONO</span>
          <span>16-BIT LE</span>
          <span className="text-emerald-500/90 font-semibold">STUDIO CLEAN</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={720}
        height={90}
        className="w-full h-22 rounded-lg block"
      />
    </div>
  );
};
