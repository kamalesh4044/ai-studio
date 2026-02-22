export type MessageRole = "user" | "assistant";
export type AttachmentKind = "image" | "video";

export interface Attachment {
  id: string;
  kind: AttachmentKind;
  url: string;
  label?: string;
  mimeType?: string;
  persist?: boolean;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ChatModel {
  id: string;
  name: string;
  provider: string;
  notes: string;
}
