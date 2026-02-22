import { useMemo, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import clsx from "clsx";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

function VideoAttachment({ url, label }: { url: string; label?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
        Mock video could not load in this environment.
      </div>
    );
  }

  return (
    <video
      src={url}
      controls
      playsInline
      onError={() => setFailed(true)}
      className="max-h-72 w-full rounded-xl border border-ink-200/70 bg-black/80 dark:border-ink-700/70"
      aria-label={label || "Generated mock video"}
    />
  );
}

export default function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";
  const timestamp = useMemo(() => format(new Date(message.createdAt), "h:mm a"), [message.createdAt]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={clsx("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={clsx(
          "max-w-[92%] rounded-2xl border px-4 py-3 shadow-sm md:max-w-[78%]",
          isUser
            ? "border-accent-500/10 bg-accent-500 text-white"
            : "border-ink-200/70 bg-white/75 text-ink-900 dark:border-ink-700/70 dark:bg-ink-900/70 dark:text-ink-100"
        )}
      >
        {message.attachments && message.attachments.length > 0 ? (
          <div className="mb-3 space-y-2">
            {message.attachments.map((attachment) => (
              <div key={attachment.id}>
                {attachment.kind === "image" ? (
                  <img
                    src={attachment.url}
                    alt={attachment.label || "Attached image"}
                    className="max-h-80 w-full rounded-xl border border-ink-200/70 object-contain dark:border-ink-700/70"
                  />
                ) : (
                  <VideoAttachment url={attachment.url} label={attachment.label} />
                )}
              </div>
            ))}
          </div>
        ) : null}

        <div className={clsx("text-sm leading-relaxed", isUser ? "text-white" : "text-ink-900 dark:text-ink-100")}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              code: ({ children }) => (
                <code
                  className={clsx(
                    "rounded-md px-1.5 py-0.5 font-mono text-[0.84em]",
                    isUser ? "bg-white/15" : "bg-ink-100 dark:bg-ink-800"
                  )}
                >
                  {children}
                </code>
              )
            }}
          >
            {message.content || (isUser ? "" : " ")}
          </ReactMarkdown>
        </div>

        <p className={clsx("mt-2 text-[11px]", isUser ? "text-cyan-100" : "text-ink-500 dark:text-ink-400")}>
          {timestamp}
        </p>
      </div>
    </motion.article>
  );
}
