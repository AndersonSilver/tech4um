import { PRESET_AVATARS } from "@tech4um/shared";
import { isValidUploadedImageUrl } from "./imageUpload";

const PRESET_PATHS = new Set(PRESET_AVATARS.map((avatar) => avatar.path));

export function getPresetAvatarPath(presetId: string): string | null {
  const preset = PRESET_AVATARS.find((avatar) => avatar.id === presetId);
  return preset?.path ?? null;
}

export function isValidAvatarUrl(avatarUrl: string): boolean {
  if (avatarUrl.startsWith("https://") || avatarUrl.startsWith("http://")) {
    return avatarUrl.length <= 2048;
  }

  if (PRESET_PATHS.has(avatarUrl)) {
    return true;
  }

  return isValidUploadedImageUrl(avatarUrl);
}
