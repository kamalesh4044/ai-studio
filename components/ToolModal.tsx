import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { CloseIcon, ImageIcon, MergeIcon, VideoIcon } from "@/components/icons";

export type ToolMode = "image" | "video" | "transition";

interface ToolModalProps {
  mode: ToolMode | null;
  isBusy: boolean;
  onClose: () => void;
  onGenerateImage: (prompt: string) => Promise<void>;
  onGenerateVideo: (image: File, prompt: string) => Promise<void>;
  onGenerateTransition: (imageA: File, imageB: File, prompt: string) => Promise<void>;
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    if (!file) {
      setUrl("");
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  return url;
}

export default function ToolModal({
  mode,
  isBusy,
  onClose,
  onGenerateImage,
  onGenerateVideo,
  onGenerateTransition
}: ToolModalProps) {
  const [prompt, setPrompt] = useState("");
  const [imageA, setImageA] = useState<File | null>(null);
  const [imageB, setImageB] = useState<File | null>(null);

  const previewA = useObjectUrl(imageA);
  const previewB = useObjectUrl(imageB);

  useEffect(() => {
    if (!mode) {
      return;
    }
    setPrompt("");
    setImageA(null);
    setImageB(null);
  }, [mode]);

  const title = useMemo(() => {
    if (mode === "image") return "Text to Image";
    if (mode === "video") return "Image to Video";
    if (mode === "transition") return "Two-Image Transition";
    return "";
  }, [mode]);

  const icon = useMemo(() => {
    if (mode === "image") return <ImageIcon className="h-5 w-5" />;
    if (mode === "video") return <VideoIcon className="h-5 w-5" />;
    if (mode === "transition") return <MergeIcon className="h-5 w-5" />;
    return null;
  }, [mode]);

  if (!mode) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 p-3 backdrop-blur-sm md:items-center">
      <div className="app-shell w-full max-w-xl rounded-2xl border border-ink-200/70 shadow-panel dark:border-ink-700/70">
        <div className="flex items-center justify-between border-b border-ink-200/70 px-4 py-3 dark:border-ink-700/70">
          <div className="flex items-center gap-2 text-ink-900 dark:text-ink-100">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
              {icon}
            </span>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">Works with real endpoints and mock fallback</p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
            onClick={onClose}
            aria-label="Close tool modal"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-200">Prompt</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={3}
              placeholder={
                mode === "image"
                  ? "Describe the image you want to generate"
                  : mode === "video"
                    ? "Describe camera movement, style, or motion"
                    : "Describe how image A should transition into image B"
              }
              className="w-full resize-y rounded-xl border border-ink-300/80 bg-white/70 px-3 py-2 text-sm outline-none transition focus:border-accent-500 dark:border-ink-600 dark:bg-ink-900/60"
            />
          </label>

          {mode !== "image" ? (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-200">
                  {mode === "video" ? "Source Image" : "First Image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setImageA(event.target.files?.[0] ?? null)}
                  className="block w-full rounded-xl border border-ink-300/80 bg-white/70 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-accent-100 file:px-2 file:py-1 file:text-accent-800 hover:file:bg-accent-200 dark:border-ink-600 dark:bg-ink-900/60 dark:file:bg-accent-900/35 dark:file:text-accent-200"
                />
                {previewA ? (
                  <img
                    src={previewA}
                    alt="First upload preview"
                    className="mt-2 max-h-40 rounded-xl border border-ink-200/80 object-contain dark:border-ink-700/70"
                  />
                ) : null}
              </label>

              {mode === "transition" ? (
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-200">Second Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageB(event.target.files?.[0] ?? null)}
                    className="block w-full rounded-xl border border-ink-300/80 bg-white/70 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-accent-100 file:px-2 file:py-1 file:text-accent-800 hover:file:bg-accent-200 dark:border-ink-600 dark:bg-ink-900/60 dark:file:bg-accent-900/35 dark:file:text-accent-200"
                  />
                  {previewB ? (
                    <img
                      src={previewB}
                      alt="Second upload preview"
                      className="mt-2 max-h-40 rounded-xl border border-ink-200/80 object-contain dark:border-ink-700/70"
                    />
                  ) : null}
                </label>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-ink-200/70 px-4 py-3 dark:border-ink-700/70">
          <button
            type="button"
            className="rounded-xl border border-ink-300/80 px-4 py-2 text-sm text-ink-700 transition hover:bg-ink-100 dark:border-ink-600 dark:text-ink-300 dark:hover:bg-ink-800"
            onClick={onClose}
            disabled={isBusy}
          >
            Cancel
          </button>
          <button
            type="button"
            className={clsx(
              "rounded-xl px-4 py-2 text-sm font-semibold text-white transition",
              "bg-accent-500 hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
            )}
            disabled={
              isBusy ||
              (mode === "video" && !imageA) ||
              (mode === "transition" && (!imageA || !imageB))
            }
            onClick={async () => {
              if (mode === "image") {
                await onGenerateImage(prompt.trim());
                return;
              }
              if (mode === "video" && imageA) {
                await onGenerateVideo(imageA, prompt.trim());
                return;
              }
              if (mode === "transition" && imageA && imageB) {
                await onGenerateTransition(imageA, imageB, prompt.trim());
              }
            }}
          >
            {isBusy ? "Working..." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
