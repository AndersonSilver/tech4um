import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const uploadsDir = path.resolve(__dirname, "../../uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

export function getUploadsDirectory() {
  ensureUploadsDir();
  return uploadsDir;
}

export function saveImageFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!match) {
    throw new Error("Formato de imagem inválido");
  }

  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error("Tipo de imagem não suportado");
  }

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Imagem excede o tamanho máximo de 10MB");
  }

  const extension = mimeType.split("/")[1].replace("jpeg", "jpg");
  ensureUploadsDir();
  const filename = `${randomUUID()}.${extension}`;
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);

  return `/api/uploads/${filename}`;
}

export function isValidUploadedImageUrl(imageUrl: string): boolean {
  return /^\/api\/uploads\/[a-zA-Z0-9-]+\.(jpg|jpeg|png|gif|webp)$/.test(imageUrl);
}
