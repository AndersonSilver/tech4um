/** Tamanho estável para fotos do Google (evita URL sem parâmetro que falha intermitente). */
const GOOGLE_AVATAR_SIZE_SUFFIX = "=s96-c";

export function normalizeGoogleAvatarUrl(url: string): string {
  if (!url.includes("googleusercontent.com")) return url;
  if (/=s\d+(-c)?($|[?&#])/i.test(url)) return url;
  return `${url}${GOOGLE_AVATAR_SIZE_SUFFIX}`;
}

/** Imagens do Google bloqueiam hotlink se o navegador envia Referer do site. */
export const AVATAR_IMG_REFERRER_POLICY = "no-referrer" as const;

export function resolveAvatarUrl(avatarUrl?: string | null): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return normalizeGoogleAvatarUrl(avatarUrl);
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
