import type { Attachment, Conversation } from "@/types/chat";

const STORAGE_KEY = "ai-studio-conversations-v1";

function canPersistAttachment(att: Attachment): boolean {
  if (att.persist === false) {
    return false;
  }
  if (att.url.startsWith("blob:")) {
    return false;
  }
  return true;
}

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Conversation[];
    return Array.isArray(parsed)
      ? parsed.map((conversation) => ({
          ...conversation,
          messages: Array.isArray(conversation.messages)
            ? conversation.messages.map((message) => ({
                ...message,
                attachments: message.attachments ?? []
              }))
            : []
        }))
      : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  if (typeof window === "undefined") {
    return;
  }

  const sanitized = conversations.map((conversation) => ({
    ...conversation,
    messages: conversation.messages.map((message) => ({
      ...message,
      attachments: (message.attachments ?? []).filter(canPersistAttachment)
    }))
  }));

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Ignore storage quota errors in mock mode.
  }
}
