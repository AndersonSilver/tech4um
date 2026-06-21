import type { Forum, Message, User } from "../types";

export interface SenderProfile {
  id: string;
  username: string;
  avatarUrl?: string;
}

export function buildSenderProfileIndex({
  currentUser,
  participants,
  messages,
}: {
  currentUser?: User | null;
  participants?: Forum["participants"];
  messages: Message[];
}): Map<string, SenderProfile> {
  const profiles = new Map<string, SenderProfile>();

  for (const participant of participants ?? []) {
    if (!participant.user) continue;
    profiles.set(participant.userId, {
      id: participant.user.id,
      username: participant.user.username,
      avatarUrl: participant.user.avatarUrl,
    });
  }

  for (const message of messages) {
    if (!message.sender) continue;
    profiles.set(message.senderId, {
      id: message.sender.id,
      username: message.sender.username,
      avatarUrl: message.sender.avatarUrl,
    });
  }

  if (currentUser) {
    profiles.set(currentUser.id, {
      id: currentUser.id,
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
    });
  }

  return profiles;
}

export function resolveSenderProfile(
  senderId: string,
  profiles: Map<string, SenderProfile>,
  fallback?: SenderProfile
): SenderProfile | undefined {
  return profiles.get(senderId) ?? fallback;
}
