import React, { useState } from "react";
import { SceneScript, DEFAULT_SCENES, DEFAULT_EPISODE_TITLE } from "../data/defaultScript";
import {
  FileText,
  RotateCcw,
  Sparkles,
  Layers,
  Edit3,
  Clock,
  Play,
  CheckCircle,
  Copy,
  PlusCircle,
  Trash2,
} from "lucide-react";

interface ScriptEditorProps {
  scenes: SceneScript[];
  onUpdateScenes: (updated: SceneScript[]) => void;
  onResetScenes: () => void;
  onGenerateSingleScene: (scene: SceneScript) => void;
  generatingSceneId: string | null;
  activePlayingSceneId: string | null;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  scenes,
  onUpdateScenes,
  onResetScenes,
  onGenerateSingleScene,
  generatingSceneId,
  activePlayingSceneId,
}) => {
  const [editorMode, setEditorMode] = useState<"scenes" | "unified">("scenes");
  const [copied, setCopied] = useState(false);

  // Compute total stats
  const totalWords = scenes.reduce((sum, s) => sum + s.text.trim().split(/\s+/).filter(Boolean).length, 0);
  const totalCharacters = scenes.reduce((sum, s) => sum + s.text.length, 0);
  const totalEstimatedSecs = Math.round(totalWords / 2.3); // ~138 words per minute for slow cinematic trailer delivery

  const handleSceneTextChange = (id: string, newText: string) => {
    const next = scenes.map((s) => (s.id === id ? { ...s, text: newText } : s));
    onUpdateScenes(next);
  };

  const handleSceneStyleChange = (id: string, newStyle: string) => {
    const next = scenes.map((s) => (s.id === id ? { ...s, stylePrompt: newStyle } : s));
    onUpdateScenes(next);
  };

  const handleUnifiedTextChange = (fullText: string) => {
    const paragraphs = fullText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    if (paragraphs.length === 0) {
      onUpdateScenes([{ ...scenes[0], text: fullText }]);
      return;
    }
    const newScenes: SceneScript[] = paragraphs.map((para, idx) => {
      const existing = scenes[idx];
      return {
        id: existing?.id || `scene-${idx + 1}`,
        actNumber: idx + 1,
        title: existing?.title || `Part ${idx + 1}: Custom Scene`,
        mood: existing?.mood || "Cinematic Narration",
        stylePrompt: existing?.stylePrompt || "Deep mature male narrator, dark cinematic suspense, slow pace.",
        text: para.trim(),
        estimatedDurationSec: Math.round(para.split(/\s+/).length / 2.3),
      };
    });
    onUpdateScenes(newScenes);
  };

  const getFullText = () => scenes.map((s) => s.text).join("\n\n");

  const copyScriptToClipboard = () => {
    const textToCopy = `TITLE: ${DEFAULT_EPISODE_TITLE}\n\n` + scenes.map((s, idx) => `[SCENE ${idx + 1}: ${s.title.toUpperCase()} - MOOD: ${s.mood}]\n${s.text}`).join("\n\n");
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#12151e]/90 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-950/70 border border-red-700/50 flex items-center justify-center text-red-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-zinc-100 uppercase font-cinematic">
              Episode 1 Script & Story Beats
            </h2>
            <p className="text-xs text-zinc-400">
              Verbatim narration text: “The Beginning of the End”
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-[#181d2a] p-0.5 rounded-lg border border-zinc-800 flex items-center text-xs">
            <button
              type="button"
              onClick={() => setEditorMode("scenes")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
                editorMode === "scenes"
                  ? "bg-red-900/60 text-red-100 shadow-sm border border-red-700/60"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Scene Beats ({scenes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorMode("unified")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
                editorMode === "unified"
                  ? "bg-red-900/60 text-red-100 shadow-sm border border-red-700/60"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Full Script Text</span>
            </button>
          </div>

          <button
            type="button"
            onClick={copyScriptToClipboard}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/70 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy script with scene director cues"
          >
            {copied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onResetScenes}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-red-950/50 text-zinc-400 hover:text-red-300 border border-zinc-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset to official Episode 1 storyline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Script</span>
          </button>
        </div>
      </div>

      {/* Script metrics bar */}
      <div className="flex items-center gap-4 py-2.5 px-3 my-3 bg-[#0c0e14] border border-zinc-800/60 rounded-xl text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-red-400" />
          <span>Est. Narration Run Time:</span>
          <span className="text-zinc-100 font-semibold">
            ~{Math.floor(totalEstimatedSecs / 60)}m {totalEstimatedSecs % 60}s
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 border-l border-zinc-800 pl-4">
          <span>Words:</span>
          <span className="text-zinc-200 font-semibold">{totalWords}</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 border-l border-zinc-800 pl-4">
          <span>Characters:</span>
          <span className="text-zinc-200 font-semibold">{totalCharacters}</span>
        </div>
        <div className="ml-auto text-[11px] text-zinc-500">
          Target delivery: 135 wpm trailer pace
        </div>
      </div>

      {/* Mode 1: Scene-by-Scene Director Mode */}
      {editorMode === "scenes" && (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {scenes.map((scene, index) => {
            const isPlayingThisScene = activePlayingSceneId === scene.id;
            const isGeneratingThisScene = generatingSceneId === scene.id;

            // Border color accents by mood
            let moodBadgeColor = "bg-zinc-800 text-zinc-300 border-zinc-700";
            if (scene.id === "scene-1") moodBadgeColor = "bg-blue-950/60 text-blue-300 border-blue-800/60";
            if (scene.id === "scene-2") moodBadgeColor = "bg-purple-950/60 text-purple-300 border-purple-800/60";
            if (scene.id === "scene-3") moodBadgeColor = "bg-red-950/80 text-red-300 border-red-700/80";
            if (scene.id === "scene-4") moodBadgeColor = "bg-amber-950/70 text-amber-300 border-amber-800/70";
            if (scene.id === "scene-5") moodBadgeColor = "bg-rose-950/80 text-rose-300 border-rose-700/80";
            if (scene.id === "scene-6") moodBadgeColor = "bg-emerald-950/70 text-emerald-300 border-emerald-700/70";

            return (
              <div
                key={scene.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isPlayingThisScene
                    ? "bg-red-950/20 border-red-600/70 ring-1 ring-red-500/40"
                    : "bg-[#161a25]/60 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-900/60 text-red-200 text-xs font-bold font-mono flex items-center justify-center border border-red-700/50">
                      {index + 1}
                    </span>
                    <h3 className="font-semibold text-zinc-200 text-sm">
                      {scene.title}
                    </h3>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${moodBadgeColor}`}
                    >
                      {scene.mood}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onGenerateSingleScene(scene)}
                      disabled={isGeneratingThisScene}
                      className="px-2.5 py-1 rounded bg-zinc-800/90 hover:bg-red-950/70 text-zinc-300 hover:text-red-200 border border-zinc-700/70 hover:border-red-700/60 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      title="Synthesize and audition voice for this scene only"
                    >
                      {isGeneratingThisScene ? (
                        <>
                          <span className="w-3 h-3 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Audition Scene</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Director Voice Tone Directive */}
                <div className="mb-2">
                  <div className="text-[11px] font-mono text-zinc-400 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-red-400" />
                    <span>Voice Director Style Instruction:</span>
                  </div>
                  <input
                    type="text"
                    value={scene.stylePrompt}
                    onChange={(e) => handleSceneStyleChange(scene.id, e.target.value)}
                    className="w-full px-2.5 py-1 rounded bg-[#0e1017] border border-zinc-800 text-xs text-zinc-300 font-mono focus:border-red-600 focus:outline-none"
                    placeholder="Enter narration tone directive..."
                  />
                </div>

                {/* Script text editor */}
                <div>
                  <textarea
                    rows={3}
                    value={scene.text}
                    onChange={(e) => handleSceneTextChange(scene.id, e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#0a0c12] border border-zinc-800 text-zinc-200 text-sm leading-relaxed focus:border-red-600 focus:outline-none resize-y selection:bg-red-900"
                    placeholder="Type or paste the story dialogue/narration for this scene..."
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mode 2: Unified Raw Script Text */}
      {editorMode === "unified" && (
        <div>
          <div className="mb-2 text-xs text-zinc-400 flex items-center justify-between">
            <span>
              Paste your exact, unedited YouTube episode narration script below.
              Separate scenes or acts with double line breaks.
            </span>
            <span className="font-mono text-red-400 text-[11px]">
              Verbatim Narration Mode
            </span>
          </div>
          <textarea
            rows={14}
            value={getFullText()}
            onChange={(e) => handleUnifiedTextChange(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-[#0a0c12] border border-zinc-800 text-zinc-100 text-sm font-sans leading-relaxed focus:border-red-600 focus:outline-none resize-y selection:bg-red-900/80 font-mono"
            placeholder="Paste your full Episode 1 story script here..."
          />
        </div>
      )}
    </div>
  );
};
