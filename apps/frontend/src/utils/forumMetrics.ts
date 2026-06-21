import { Forum } from "../types";

export type ForumSortMode = "recent" | "popular";

export function countOnlineParticipants(forum: Forum): number {
  return (forum.participants ?? []).filter((participant) => participant.isOnline).length;
}

export function countTotalParticipants(forum: Forum): number {
  return forum.participants?.length ?? 0;
}

export function getForumActivityLabel(forum: Forum): string {
  const online = countOnlineParticipants(forum);
  const total = countTotalParticipants(forum);
  const onlineLabel = online === 1 ? "1 online" : `${online} online`;

  if (total > online) {
    const enrolledLabel = total === 1 ? "1 inscrito" : `${total} inscritos`;
    return `${onlineLabel} · ${enrolledLabel}`;
  }

  return onlineLabel;
}

export function sortForums(forums: Forum[], mode: ForumSortMode): Forum[] {
  const sorted = [...forums];

  if (mode === "popular") {
    return sorted.sort((a, b) => {
      const onlineDiff = countOnlineParticipants(b) - countOnlineParticipants(a);
      if (onlineDiff !== 0) return onlineDiff;

      const totalDiff = countTotalParticipants(b) - countTotalParticipants(a);
      if (totalDiff !== 0) return totalDiff;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  return sorted.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
