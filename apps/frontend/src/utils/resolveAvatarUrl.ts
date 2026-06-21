export function resolveAvatarUrl(avatarUrl?: string | null): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }

  const apiBase = import.meta.env.VITE_API_URL || "/api";
  const origin = apiBase.startsWith("http")
    ? apiBase.replace(/\/api\/?$/, "")
    : window.location.origin;
  return `${origin}${avatarUrl}`;
}

export function getUserInitial(username: string): string {
  return username.charAt(0).toUpperCase();
}
