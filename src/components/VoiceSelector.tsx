import React from "react";
import { Mic, Sliders, Volume2, ShieldAlert, Sparkles, Check } from "lucide-react";
import { VOICE_OPTIONS, VoiceOption } from "../data/defaultScript";

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  pacing: number;
  onChangePacing: (pacing: number) => void;
  pauseBetweenMs: number;
  onChangePause: (pauseMs: number) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  pacing,
  onChangePacing,
  pauseBetweenMs,
  onChangePause,
}) => {
  return (
    <div className="bg-[#12151e]/90 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-950/70 border border-red-700/50 flex items-center justify-center text-red-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-zinc-100 uppercase font-cinematic">
              Narrator Voice Profile
            </h2>
            <p className="text-xs text-zinc-400">
              Deep, mature English male narration models with dark cinematic suspense
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/40 border border-red-800/40 text-[11px] text-red-300 font-mono">
          <Sparkles className="w-3 h-3 text-red-400" />
          <span>Gemini 3.8 Flagship TTS</span>
        </div>
      </div>

      {/* Voice cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {VOICE_OPTIONS.map((voice: VoiceOption) => {
          const isSelected = selectedVoice === voice.id;
          return (
            <button
              key={voice.id}
              type="button"
              onClick={() => onSelectVoice(voice.id)}
              className={`relative text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-red-950/30 border-red-600 shadow-[0_0_15px_-3px_rgba(220,38,38,0.35)] ring-1 ring-red-500/50"
                  : "bg-[#161a25]/60 border-zinc-800/90 hover:border-zinc-700 hover:bg-[#1a1f2c]"
              }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-100 text-sm">
                      {voice.name}
                    </span>
                    {isSelected && (
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[10px]">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-red-400/90 block mt-0.5">
                    {voice.role}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                  {voice.pitch}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                {voice.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Narrative Pacing & Dramatic Pause Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-zinc-800/80">
        {/* Pacing Control */}
        <div className="bg-[#161a25]/50 border border-zinc-800/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-zinc-300 font-medium flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-zinc-400" />
              Delivery Pacing
            </span>
            <span className="font-mono text-red-400 font-semibold">
              {pacing <= 0.88
                ? `${pacing}x (Slow & Suspenseful)`
                : pacing <= 0.95
                ? `${pacing}x (Trailer Pace)`
                : `${pacing}x (Documentary)`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChangePacing(0.85)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                pacing === 0.85
                  ? "bg-red-900/60 text-red-200 border border-red-700/60"
                  : "bg-zinc-800/70 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              0.85x Slow
            </button>
            <button
              type="button"
              onClick={() => onChangePacing(0.92)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                pacing === 0.92
                  ? "bg-red-900/60 text-red-200 border border-red-700/60"
                  : "bg-zinc-800/70 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              0.92x Cinematic
            </button>
            <button
              type="button"
              onClick={() => onChangePacing(1.0)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                pacing === 1.0
                  ? "bg-red-900/60 text-red-200 border border-red-700/60"
                  : "bg-zinc-800/70 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              1.0x Normal
            </button>
          </div>
        </div>

        {/* Dramatic Pause Gap */}
        <div className="bg-[#161a25]/50 border border-zinc-800/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-zinc-300 font-medium flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
              Scene Transition Pause
            </span>
            <span className="font-mono text-amber-400 font-semibold">
              {(pauseBetweenMs / 1000).toFixed(1)}s Pause
            </span>
          </div>
          <div className="flex items-center gap-2">
            {[500, 800, 1200, 1800].map((ms) => (
              <button
                key={ms}
                type="button"
                onClick={() => onChangePause(ms)}
                className={`flex-1 py-1 rounded text-[11px] font-mono transition-colors text-center ${
                  pauseBetweenMs === ms
                    ? "bg-amber-950/70 text-amber-200 border border-amber-700/60"
                    : "bg-zinc-800/70 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {(ms / 1000).toFixed(1)}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quality notes badge */}
      <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400">
        <ShieldAlert className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <span>
          Strict studio adherence: Zero background music, zero sound effects, exact verbatim script pronunciation, calibrated for graphic-novel YouTube video editors.
        </span>
      </div>
    </div>
  );
};
