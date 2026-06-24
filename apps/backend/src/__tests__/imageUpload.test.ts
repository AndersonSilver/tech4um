import fs from "fs";
import path from "path";
import {
  getUploadsDirectory,
  saveImageFromDataUrl,
  isValidUploadedImageUrl,
} from "../utils/imageUpload";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("imageUpload", () => {
  const savedFiles: string[] = [];

  afterEach(() => {
    for (const file of savedFiles) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    savedFiles.length = 0;
  });

  it("getUploadsDirectory retorna diretório existente", () => {
    const dir = getUploadsDirectory();
    expect(fs.existsSync(dir)).toBe(true);
  });

  it("saveImageFromDataUrl persiste PNG e retorna URL da API", () => {
    const imageUrl = saveImageFromDataUrl(TINY_PNG);
    expect(isValidUploadedImageUrl(imageUrl)).toBe(true);

    const filename = imageUrl.replace("/api/uploads/", "");
    const fullPath = path.join(getUploadsDirectory(), filename);
    savedFiles.push(fullPath);
    expect(fs.existsSync(fullPath)).toBe(true);
  });

  it("saveImageFromDataUrl rejeita formato inválido", () => {
    expect(() => saveImageFromDataUrl("not-a-data-url")).toThrow("Formato de imagem inválido");
  });

  it("saveImageFromDataUrl rejeita mime não suportado", () => {
    expect(() =>
      saveImageFromDataUrl("data:image/bmp;base64,AAAA")
    ).toThrow("Tipo de imagem não suportado");
  });

  it("isValidUploadedImageUrl valida apenas paths seguros de upload", () => {
    expect(isValidUploadedImageUrl("/api/uploads/uuid-1.png")).toBe(true);
    expect(isValidUploadedImageUrl("/api/uploads/evil.php")).toBe(false);
    expect(isValidUploadedImageUrl("https://evil.com/x.png")).toBe(false);
  });
});
