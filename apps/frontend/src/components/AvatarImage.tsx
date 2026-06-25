import { useState } from "react";
import {
  AVATAR_IMG_REFERRER_POLICY,
  getUserInitial,
  resolveAvatarUrl,
} from "../utils/resolveAvatarUrl";

interface AvatarImageProps {
  avatarUrl?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function AvatarImage({
  avatarUrl,
  alt,
  className,
  fallbackClassName,
}: AvatarImageProps) {
  const [failed, setFailed] = useState(false);
  const src = resolveAvatarUrl(avatarUrl);

  if (!src || failed) {
    return (
      <span
        className={
          fallbackClassName ??
          "flex h-full w-full items-center justify-center font-poppins text-xs text-background bg-primary-dark"
        }
      >
        {getUserInitial(alt)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy={AVATAR_IMG_REFERRER_POLICY}
      onError={() => setFailed(true)}
    />
  );
}
