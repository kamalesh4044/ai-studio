import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";
import type { Conversation } from "@/types/chat";
import { PlusIcon, PencilIcon, TrashIcon, CloseIcon } from "@/components/icons";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onCloseMobile?: () => void;
}

export default function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  onCloseMobile
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const sorted = useMemo(
    () =>
      [...conversations].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [conversations]
  );

  return (
    <aside className="app-shell flex h-full w-[18rem] shrink-0 flex-col rounded-2xl shadow-panel">
      <div className="flex items-center justify-between border-b border-ink-200/70 p-4 dark:border-ink-700/70">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-ink-500 dark:text-ink-300">Workspace</p>
          <p className="text-base font-semibold text-ink-900 dark:text-ink-100">AI Studio</p>
        </div>
        {onCloseMobile ? (
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200/70 text-ink-600 transition hover:bg-ink-100 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-600"
        >
          <PlusIcon className="h-4 w-4" />
          New Chat
        </button>
      </div>

      <div className="soft-scroll flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {sorted.map((conversation) => {
          const active = conversation.id === activeId;
          const isEditing = editingId === conversation.id;
          return (
            <div
              key={conversation.id}
              className={clsx(
                "group rounded-xl border p-3 transition",
                active
                  ? "border-accent-400 bg-accent-50/75 dark:border-accent-600 dark:bg-accent-900/20"
                  : "border-ink-200/70 bg-white/50 hover:border-ink-300 dark:border-ink-700/70 dark:bg-ink-900/40 dark:hover:border-ink-500"
              )}
            >
              {isEditing ? (
                <input
                  autoFocus
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  onBlur={() => {
                    const next = draftTitle.trim() || "Untitled Chat";
                    onRename(conversation.id, next);
                    setEditingId(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      const next = draftTitle.trim() || "Untitled Chat";
                      onRename(conversation.id, next);
                      setEditingId(null);
                    }
                    if (event.key === "Escape") {
                      setEditingId(null);
                    }
                  }}
                  className="w-full rounded-lg border border-ink-300 bg-white px-2 py-1.5 text-sm outline-none dark:border-ink-600 dark:bg-ink-800"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onSelect(conversation.id);
                    onCloseMobile?.();
                  }}
                  className="w-full text-left"
                >
                  <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-100">
                    {conversation.title}
                  </p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">
                    {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                  </p>
                </button>
              )}

              {!isEditing ? (
                <div className="mt-2 flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(conversation.id);
                      setDraftTitle(conversation.title);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
                    aria-label={`Rename ${conversation.title}`}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(conversation.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/30"
                    aria-label={`Delete ${conversation.title}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
