import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { v4 as uuidv4 } from "uuid";
import { motion } from "framer-motion";
import ChatSidebar from "@/components/ChatSidebar";
import ChatMessage from "@/components/ChatMessage";
import ModelSelector from "@/components/ModelSelector";
import ThemeToggle from "@/components/ThemeToggle";
import ImageUploader from "@/components/ImageUploader";
import ToolModal, { type ToolMode } from "@/components/ToolModal";
import { ImageIcon, MenuIcon, MergeIcon, SendIcon, VideoIcon } from "@/components/icons";
import type { Attachment, ChatMessage as ChatMessageType, Conversation } from "@/types/chat";
import { DEFAULT_CHAT_MODEL } from "@/utils/models";
import { loadConversations, saveConversations } from "@/utils/storage";
import { fileToDataUrl, isImageFile, isVideoFile } from "@/utils/files";

interface QueuedUpload {
  id: string;
  file: File;
  previewUrl: string;
  kind: "image" | "video";
}

function createConversation(title = "New Chat"): Conversation {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    title,
    createdAt: now,
    updatedAt: now,
    messages: []
  };
}

function createMessage(role: "user" | "assistant", content: string, attachments?: Attachment[]): ChatMessageType {
  return {
    id: uuidv4(),
    role,
    content,
    createdAt: new Date().toISOString(),
    attachments
  };
}

function previewTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New Chat";
  return clean.length > 42 ? `${clean.slice(0, 42)}...` : clean;
}

export default function HomePage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [queuedUploads, setQueuedUploads] = useState<QueuedUpload[]>([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CHAT_MODEL);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isToolBusy, setIsToolBusy] = useState(false);
  const [toolMode, setToolMode] = useState<ToolMode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const hasHydrated = useRef(false);

  useEffect(() => {
    const stored = loadConversations();
    if (stored.length > 0) {
      setConversations(stored);
      setActiveConversationId(stored[0].id);
      return;
    }
    const fresh = createConversation();
    setConversations([fresh]);
    setActiveConversationId(fresh.id);
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      return;
    }
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversations, activeConversationId, isStreaming]);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = window.setTimeout(() => setErrorMessage(""), 4200);
    return () => window.clearTimeout(timer);
  }, [errorMessage]);

  const updateConversation = useCallback(
    (conversationId: string, updater: (conversation: Conversation) => Conversation) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId ? updater(conversation) : conversation
        )
      );
    },
    []
  );

  const appendMessage = useCallback(
    (conversationId: string, message: ChatMessageType) => {
      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        messages: [...conversation.messages, message],
        updatedAt: new Date().toISOString()
      }));
    },
    [updateConversation]
  );

  const updateMessageContent = useCallback(
    (conversationId: string, messageId: string, content: string) => {
      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) =>
          message.id === messageId ? { ...message, content } : message
        ),
        updatedAt: new Date().toISOString()
      }));
    },
    [updateConversation]
  );

  const queueFiles = useCallback(
    (files: File[]) => {
      const slotsLeft = Math.max(0, 4 - queuedUploads.length);
      const trimmed = files.slice(0, slotsLeft);

      if (trimmed.length < files.length) {
        setErrorMessage("Attachment limit reached (max 4 queued files).");
      }

      const nextUploads: QueuedUpload[] = [];
      for (const file of trimmed) {
        if (!isImageFile(file) && !isVideoFile(file)) {
          setErrorMessage("Only image and video files are supported.");
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setErrorMessage("Each file must be under 10 MB.");
          continue;
        }
        nextUploads.push({
          id: uuidv4(),
          file,
          previewUrl: URL.createObjectURL(file),
          kind: isImageFile(file) ? "image" : "video"
        });
      }

      if (nextUploads.length === 0) return;
      setQueuedUploads((prev) => [...prev, ...nextUploads]);
    },
    [queuedUploads.length]
  );

  const removeQueuedUpload = useCallback((uploadId: string) => {
    setQueuedUploads((prev) => {
      const item = prev.find((upload) => upload.id === uploadId);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((upload) => upload.id !== uploadId);
    });
  }, []);

  const clearQueuedUploads = useCallback(() => {
    setQueuedUploads((prev) => {
      prev.forEach((upload) => URL.revokeObjectURL(upload.previewUrl));
      return [];
    });
  }, []);

  const createNewConversation = useCallback(() => {
    const fresh = createConversation();
    setConversations((prev) => [fresh, ...prev]);
    setActiveConversationId(fresh.id);
    setInput("");
    clearQueuedUploads();
    setErrorMessage("");
    setIsMobileSidebarOpen(false);
  }, [clearQueuedUploads]);

  const deleteConversation = useCallback(
    (conversationId: string) => {
      setConversations((prev) => {
        const next = prev.filter((conversation) => conversation.id !== conversationId);
        if (next.length === 0) {
          const replacement = createConversation();
          setActiveConversationId(replacement.id);
          return [replacement];
        }
        if (activeConversationId === conversationId) {
          setActiveConversationId(next[0].id);
        }
        return next;
      });
    },
    [activeConversationId]
  );

  const renameConversation = useCallback((conversationId: string, title: string) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, title: title.trim() || "Untitled Chat", updatedAt: new Date().toISOString() }
          : conversation
      )
    );
  }, []);

  const maybeRenameFromFirstMessage = useCallback((conversationId: string, text: string) => {
    setConversations((prev) =>
      prev.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;
        if (conversation.messages.length > 1 || conversation.title !== "New Chat") return conversation;
        return { ...conversation, title: previewTitle(text), updatedAt: new Date().toISOString() };
      })
    );
  }, []);

  const streamAssistantReply = useCallback(
    async (conversationId: string, userMessage: ChatMessageType) => {
      const placeholder = createMessage("assistant", "");
      appendMessage(conversationId, placeholder);
      setIsStreaming(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: selectedModel,
            stream: true,
            messages: (activeConversation?.messages ?? []).concat(userMessage).map((message) => ({
              role: message.role,
              content: message.content
            }))
          })
        });

        if (!response.ok || !response.body) {
          throw new Error(`Chat request failed with status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          updateMessageContent(conversationId, placeholder.id, accumulated);
        }

        accumulated += decoder.decode();
        updateMessageContent(conversationId, placeholder.id, accumulated.trim() || "...");
      } catch (error) {
        updateMessageContent(
          conversationId,
          placeholder.id,
          "I could not complete the response stream. Please retry."
        );
        setErrorMessage(error instanceof Error ? error.message : "Chat stream failed.");
      } finally {
        setIsStreaming(false);
      }
    },
    [activeConversation?.messages, appendMessage, selectedModel, updateMessageContent]
  );

  const handleSend = useCallback(async () => {
    if (!activeConversationId || isStreaming || isToolBusy) return;
    const trimmed = input.trim();
    const hasUploads = queuedUploads.length > 0;
    if (!trimmed && !hasUploads) return;

    if (trimmed.toLowerCase().startsWith("/image")) {
      const prompt = trimmed.replace(/^\/image\s*/i, "").trim() || "Untitled concept";
      setInput("");
      clearQueuedUploads();
      await (async () => {
        setIsToolBusy(true);
        appendMessage(
          activeConversationId,
          createMessage("user", `/image ${prompt}`)
        );
        maybeRenameFromFirstMessage(activeConversationId, prompt);

        try {
          const response = await fetch("/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, model: selectedModel })
          });
          if (!response.ok) {
            throw new Error(`Image generation failed (${response.status})`);
          }
          const payload = (await response.json()) as { image: string };
          appendMessage(
            activeConversationId,
            createMessage(
              "assistant",
              `Here is your generated image for "${prompt}".`,
              [{ id: uuidv4(), kind: "image", url: payload.image, label: prompt }]
            )
          );
        } catch (error) {
          appendMessage(
            activeConversationId,
            createMessage("assistant", "Mock image generation failed. Please retry.")
          );
          setErrorMessage(error instanceof Error ? error.message : "Image generation failed.");
        } finally {
          setIsToolBusy(false);
        }
      })();
      return;
    }

    const attachments: Attachment[] = queuedUploads.map((upload) => ({
      id: upload.id,
      kind: upload.kind,
      url: URL.createObjectURL(upload.file),
      label: upload.file.name,
      mimeType: upload.file.type,
      persist: false
    }));

    const userMessage = createMessage("user", trimmed, attachments);
    appendMessage(activeConversationId, userMessage);
    maybeRenameFromFirstMessage(activeConversationId, trimmed || "Uploaded media");
    setInput("");
    clearQueuedUploads();

    await streamAssistantReply(activeConversationId, userMessage);
  }, [
    activeConversationId,
    appendMessage,
    clearQueuedUploads,
    input,
    isStreaming,
    isToolBusy,
    maybeRenameFromFirstMessage,
    queuedUploads,
    selectedModel,
    streamAssistantReply
  ]);

  const generateImage = useCallback(
    async (prompt: string) => {
      if (!activeConversationId) return;
      setIsToolBusy(true);

      const normalizedPrompt = prompt || "A cinematic concept art scene";
      appendMessage(activeConversationId, createMessage("user", `Generate image: ${normalizedPrompt}`));
      maybeRenameFromFirstMessage(activeConversationId, normalizedPrompt);

      try {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: normalizedPrompt, model: selectedModel })
        });
        if (!response.ok) {
          throw new Error(`Image generation failed (${response.status})`);
        }
        const data = (await response.json()) as { image: string };
        appendMessage(
          activeConversationId,
          createMessage(
            "assistant",
            `Image generated using ${selectedModel}.`,
            [{ id: uuidv4(), kind: "image", url: data.image, label: normalizedPrompt }]
          )
        );
        setToolMode(null);
      } catch (error) {
        appendMessage(
          activeConversationId,
          createMessage("assistant", "Image generation failed. Please retry.")
        );
        setErrorMessage(error instanceof Error ? error.message : "Image generation failed.");
      } finally {
        setIsToolBusy(false);
      }
    },
    [activeConversationId, appendMessage, maybeRenameFromFirstMessage, selectedModel]
  );

  const generateImageToVideo = useCallback(
    async (image: File, prompt: string) => {
      if (!activeConversationId) return;
      setIsToolBusy(true);
      const normalizedPrompt = prompt || "Subtle camera drift";
      appendMessage(activeConversationId, createMessage("user", `Image-to-video: ${normalizedPrompt}`));
      maybeRenameFromFirstMessage(activeConversationId, normalizedPrompt);

      try {
        const imageBase64 = await fileToDataUrl(image);
        const response = await fetch("/api/image-to-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: normalizedPrompt,
            image: imageBase64,
            model: selectedModel
          })
        });
        if (!response.ok) {
          throw new Error(`Image-to-video failed (${response.status})`);
        }
        const data = (await response.json()) as { video: string | null; message?: string };
        if (!data.video) {
          throw new Error(data.message || "No video URL returned.");
        }
        appendMessage(
          activeConversationId,
          createMessage(
            "assistant",
            data.message || "Mock image-to-video complete.",
            [{ id: uuidv4(), kind: "video", url: data.video, label: normalizedPrompt }]
          )
        );
        setToolMode(null);
      } catch (error) {
        appendMessage(
          activeConversationId,
          createMessage("assistant", "Image-to-video failed. Please retry.")
        );
        setErrorMessage(error instanceof Error ? error.message : "Image-to-video failed.");
      } finally {
        setIsToolBusy(false);
      }
    },
    [activeConversationId, appendMessage, maybeRenameFromFirstMessage, selectedModel]
  );

  const generateTransition = useCallback(
    async (imageA: File, imageB: File, prompt: string) => {
      if (!activeConversationId) return;
      setIsToolBusy(true);
      const normalizedPrompt = prompt || "Smooth cinematic morph";
      appendMessage(activeConversationId, createMessage("user", `Transition: ${normalizedPrompt}`));
      maybeRenameFromFirstMessage(activeConversationId, normalizedPrompt);

      try {
        const [imageOne, imageTwo] = await Promise.all([fileToDataUrl(imageA), fileToDataUrl(imageB)]);
        const response = await fetch("/api/transition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: normalizedPrompt,
            image1: imageOne,
            image2: imageTwo,
            model: selectedModel
          })
        });
        if (!response.ok) {
          throw new Error(`Transition failed (${response.status})`);
        }
        const data = (await response.json()) as { video: string | null; message?: string };
        if (!data.video) {
          throw new Error(data.message || "No video URL returned.");
        }
        appendMessage(
          activeConversationId,
          createMessage(
            "assistant",
            data.message || "Mock transition complete.",
            [{ id: uuidv4(), kind: "video", url: data.video, label: normalizedPrompt }]
          )
        );
        setToolMode(null);
      } catch (error) {
        appendMessage(
          activeConversationId,
          createMessage("assistant", "Transition generation failed. Please retry.")
        );
        setErrorMessage(error instanceof Error ? error.message : "Transition failed.");
      } finally {
        setIsToolBusy(false);
      }
    },
    [activeConversationId, appendMessage, maybeRenameFromFirstMessage, selectedModel]
  );

  return (
    <div className="h-screen w-full p-3 md:p-4">
      <div className="mx-auto flex h-full max-w-[1500px] gap-3">
        <div className="hidden md:block">
          <ChatSidebar
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={setActiveConversationId}
            onCreate={createNewConversation}
            onDelete={deleteConversation}
            onRename={renameConversation}
          />
        </div>

        {isMobileSidebarOpen ? (
          <div className="fixed inset-0 z-40 flex bg-ink-950/45 p-3 backdrop-blur-sm md:hidden">
            <ChatSidebar
              conversations={conversations}
              activeId={activeConversationId}
              onSelect={setActiveConversationId}
              onCreate={createNewConversation}
              onDelete={deleteConversation}
              onRename={renameConversation}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        ) : null}

        <main className="app-shell relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl shadow-panel">
          <header className="flex items-center justify-between border-b border-ink-200/70 px-3 py-3 dark:border-ink-700/70 md:px-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200/70 bg-white/70 text-ink-700 transition hover:bg-white md:hidden dark:border-ink-700 dark:bg-ink-900/70 dark:text-ink-200 dark:hover:bg-ink-900"
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400">AI Workspace</p>
                <h1 className="text-lg font-semibold text-ink-900 dark:text-ink-100">Chat + Vision + Video</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ModelSelector value={selectedModel} onChange={setSelectedModel} />
              <ThemeToggle />
            </div>
          </header>

          <section className="border-b border-ink-200/60 px-3 py-2 dark:border-ink-700/70 md:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-ink-300/80 bg-white/65 px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-white dark:border-ink-600 dark:bg-ink-900/60 dark:text-ink-200 dark:hover:bg-ink-900"
                onClick={() => setToolMode("image")}
                disabled={isStreaming || isToolBusy}
              >
                <ImageIcon className="h-4 w-4" />
                Generate Image
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-ink-300/80 bg-white/65 px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-white dark:border-ink-600 dark:bg-ink-900/60 dark:text-ink-200 dark:hover:bg-ink-900"
                onClick={() => setToolMode("video")}
                disabled={isStreaming || isToolBusy}
              >
                <VideoIcon className="h-4 w-4" />
                Image to Video
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-ink-300/80 bg-white/65 px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-white dark:border-ink-600 dark:bg-ink-900/60 dark:text-ink-200 dark:hover:bg-ink-900"
                onClick={() => setToolMode("transition")}
                disabled={isStreaming || isToolBusy}
              >
                <MergeIcon className="h-4 w-4" />
                Two-Image Transition
              </button>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                Slash command: <code className="rounded bg-ink-100 px-1 py-0.5 dark:bg-ink-800">/image your prompt</code>
              </p>
            </div>
          </section>

          <section className="soft-scroll flex-1 overflow-y-auto px-3 py-4 md:px-5">
            <div className="mx-auto max-w-4xl space-y-4">
              {activeConversation && activeConversation.messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-dashed border-ink-300/90 bg-white/60 p-6 text-sm text-ink-600 dark:border-ink-600 dark:bg-ink-900/50 dark:text-ink-300"
                >
                  Start with a message, upload files, or launch one of the generation tools above.
                </motion.div>
              ) : null}

              {activeConversation?.messages.map((message) => <ChatMessage key={message.id} message={message} />)}

              {isStreaming ? (
                <div className="text-sm text-ink-500 dark:text-ink-400">Streaming response...</div>
              ) : null}

              <div ref={endOfMessagesRef} />
            </div>
          </section>

          <section className="border-t border-ink-200/70 px-3 py-3 dark:border-ink-700/70 md:px-5">
            <div className="mx-auto max-w-4xl">
              {errorMessage ? (
                <p className="mb-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/40 dark:bg-rose-900/25 dark:text-rose-200">
                  {errorMessage}
                </p>
              ) : null}

              {queuedUploads.length > 0 ? (
                <div className="mb-2 flex flex-wrap gap-2">
                  {queuedUploads.map((upload) => (
                    <div
                      key={upload.id}
                      className="relative rounded-lg border border-ink-300/80 bg-white/70 p-1 dark:border-ink-600 dark:bg-ink-900/70"
                    >
                      {upload.kind === "image" ? (
                        <img
                          src={upload.previewUrl}
                          alt={upload.file.name}
                          className="h-16 w-16 rounded object-cover"
                        />
                      ) : (
                        <video src={upload.previewUrl} className="h-16 w-16 rounded object-cover" />
                      )}
                      <button
                        type="button"
                        className="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-xs text-white"
                        onClick={() => removeQueuedUpload(upload.id)}
                        aria-label={`Remove ${upload.file.name}`}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="rounded-2xl border border-ink-300/90 bg-white/70 p-2 dark:border-ink-600 dark:bg-ink-900/70">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  rows={2}
                  placeholder="Message your assistant..."
                  className="w-full resize-none rounded-xl bg-transparent px-2 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-400 dark:text-ink-100 dark:placeholder:text-ink-500"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                />

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ImageUploader
                      onUpload={queueFiles}
                      accept={{ "image/*": [] }}
                      multiple
                    >
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-ink-300/80 bg-white/70 px-3 py-1.5 text-sm text-ink-700 transition hover:bg-white dark:border-ink-600 dark:bg-ink-900/70 dark:text-ink-200 dark:hover:bg-ink-900"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Image
                      </button>
                    </ImageUploader>

                    <ImageUploader
                      onUpload={queueFiles}
                      accept={{ "video/*": [] }}
                      multiple
                    >
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-ink-300/80 bg-white/70 px-3 py-1.5 text-sm text-ink-700 transition hover:bg-white dark:border-ink-600 dark:bg-ink-900/70 dark:text-ink-200 dark:hover:bg-ink-900"
                      >
                        <VideoIcon className="h-4 w-4" />
                        Video
                      </button>
                    </ImageUploader>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={(!input.trim() && queuedUploads.length === 0) || isStreaming || isToolBusy}
                    className={clsx(
                      "inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition",
                      "bg-accent-500 hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
                    )}
                    aria-label="Send message"
                  >
                    <SendIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <ToolModal
        mode={toolMode}
        isBusy={isToolBusy}
        onClose={() => {
          if (!isToolBusy) {
            setToolMode(null);
          }
        }}
        onGenerateImage={generateImage}
        onGenerateVideo={generateImageToVideo}
        onGenerateTransition={generateTransition}
      />
    </div>
  );
}
