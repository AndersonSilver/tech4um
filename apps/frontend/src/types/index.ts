export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

export interface Forum {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  owner?: User;
  createdAt: string;
  participants?: ForumParticipant[];
}

export interface ForumParticipant {
  id: string;
  userId: string;
  isOnline: boolean;
  user: User;
}

export type MessageType = "public" | "private";

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  senderId: string;
  recipientId?: string;
  forumId: string;
  createdAt: string;
  sender?: User;
  recipient?: User;
}
