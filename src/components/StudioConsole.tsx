import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Sparkles,
  Radio,
  FileAudio,
  CheckCircle2,
  AlertTriangle,
  FastForward,
  Rewind,
  Share2,
} from "lucide-react";
import { formatTimecode, downloadWavAudio } from "../utils/audioPlayer";
import { AudioWaveformVisualizer } from "./AudioWaveformVisualizer";
import { SceneScript, DEFAULT_EPISODE_TITLE } from "../data/defaultScript";

interface StudioConsoleProps {
  masterAudioBase64: string | null;
  currentAudioBase64: string | null;
  currentAudioLabel: string;
  isGeneratingMaster: boolean;
  generationStep: string;
  onGenerateMaster: () => void;
  selectedVoice: string;
  pacing: number;
  scenes: SceneScript[];
  cooldownSecs?: number;
  onBrowserPreview?: () => void;
}

export const StudioConsole: React.FC<StudioConsoleProps> = ({
  masterAudioBase64,
  currentAudioBase64,
  currentAudioLabel,
  isGeneratingMaster,
  generationStep,
  onGenerateMaster,
  selectedVoice,
  pacing,
  scenes,
  cooldownSecs = 0,
  onBrowserPreview,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(pacing);

  // Sync playback rate when pacing prop changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = pacing;
      setPlaybackRate(pacing);
    }
  }, [pacing]);

  // When audio source changes, update element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentAudioBase64) {
      audio.src = `data:audio/wav;base64,${currentAudioBase64}`;
      audio.playbackRate = playbackRate;
      audio.load();
      // autoplay when ready
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [currentAudioBase64, playbackRate]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentAudioBase64) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!duration && audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      audioRef.current.playbackRate = playbackRate;
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const nextTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleDownload = () => {
    const dataToDownload = masterAudioBase64 || currentAudioBase64;
    if (!dataToDownload) return;
    const cleanFilename = `Zombie_Apocalypse_Ep1_The_Beginning_of_the_End_${selectedVoice}.wav`;
    downloadWavAudio(dataToDownload, cleanFilename);
  };

  // Find approximate active sentence in script based on currentTime ratio
  const activeSceneIndex = duration > 0 ? Math.min(scenes.length - 1, Math.floor((currentTime / duration) * scenes.length)) : 0;
  const activeScene = scenes[activeSceneIndex] || scenes[0];

  return (
    <div className="bg-[#12151e]/90 border border-zinc-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Top bar with generation CTA */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-5 border-b border-zinc-800/90 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <h1 className="font-cinematic text-lg sm:text-xl font-bold tracking-wider text-zinc-100">
              Master Narration Console
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            {currentAudioBase64
              ? `Currently Loaded: ${currentAudioLabel} • Voice: ${selectedVoice}`
              : "Generate the complete Episode 1 narrative voiceover"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onBrowserPreview && (
            <button
              type="button"
              onClick={onBrowserPreview}
              className="px-3.5 py-3 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/80 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
              title="Audition using your browser's speech synthesis without consuming Gemini quota"
            >
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>Browser Audio Preview (0 Quota)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onGenerateMaster}
            disabled={isGeneratingMaster || cooldownSecs > 0}
            className={`w-full md:w-auto px-6 py-3 rounded-xl font-cinematic font-bold tracking-wider text-xs sm:text-sm uppercase flex items-center justify-center gap-2.5 transition-all duration-300 shadow-lg cursor-pointer ${
              cooldownSecs > 0
                ? "bg-amber-950/60 text-amber-300 border border-amber-700/50 cursor-not-allowed"
                : isGeneratingMaster
                ? "bg-red-950/80 text-red-300 border border-red-700/60 cursor-wait"
                : "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-950/60 hover:shadow-red-900/80 hover:scale-[1.02] active:scale-[0.99] border border-red-500/50"
            }`}
          >
            {cooldownSecs > 0 ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block" />
                <span>Rate-Limit Cooldown ({cooldownSecs}s)</span>
              </>
            ) : isGeneratingMaster ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-red-300 border-t-transparent animate-spin" />
                <span>{generationStep || "Synthesizing Master Voice..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-red-200" />
                <span>Generate Full Episode Narration</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Waveform Oscilloscope Display */}
      <div className="mb-5">
        <AudioWaveformVisualizer
          audioRef={audioRef}
          isPlaying={isPlaying}
          hasAudio={!!currentAudioBase64}
        />
      </div>

      {/* Synchronized Teleprompter Display */}
      {currentAudioBase64 && (
        <div className="mb-5 p-3.5 rounded-xl bg-[#0a0c12] border border-red-950/70 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
            <span className="text-red-400 uppercase font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              Teleprompter Sync • {activeScene.title}
            </span>
            <span className="text-zinc-500">
              Mood: {activeScene.mood}
            </span>
          </div>
          <p className="text-sm font-serif italic text-zinc-200 leading-relaxed">
            "{activeScene.text}"
          </p>
        </div>
      )}

      {/* Audio playback controls */}
      <div className="bg-[#161a25]/70 border border-zinc-800 rounded-xl p-4">
        {/* Progress bar and time */}
        <div className="flex items-center gap-3 mb-3">
          <span className="font-mono text-xs text-red-400 min-w-[55px] font-medium">
            {formatTimecode(currentTime)}
          </span>
          <div className="relative flex-1 group flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={!currentAudioBase64}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600 group-hover:h-2 transition-all"
            />
          </div>
          <span className="font-mono text-xs text-zinc-400 min-w-[55px] text-right">
            {formatTimecode(duration)}
          </span>
        </div>

        {/* Transport controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSkip(-5)}
              disabled={!currentAudioBase64}
              className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 transition-colors cursor-pointer"
              title="Skip back 5 seconds"
            >
              <Rewind className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              disabled={!currentAudioBase64}
              className={`p-3 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isPlaying
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_-3px_rgba(220,38,38,0.7)]"
                  : "bg-red-700 hover:bg-red-600 text-white shadow-md disabled:opacity-40"
              }`}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSkip(5)}
              disabled={!currentAudioBase64}
              className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 transition-colors cursor-pointer"
              title="Skip forward 5 seconds"
            >
              <FastForward className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  setCurrentTime(0);
                }
              }}
              disabled={!currentAudioBase64}
              className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 transition-colors cursor-pointer"
              title="Restart from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-18 sm:w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>

          {/* Master Export Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!currentAudioBase64 && !masterAudioBase64}
              className="px-4 py-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-200 text-xs font-semibold flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-40"
              title="Download studio-clean WAV narration audio file (24kHz Mono 16-bit)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Studio WAV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
