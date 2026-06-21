import { MessageUploadController } from "../controllers/MessageUploadController";
import * as imageUpload from "../utils/imageUpload";
import { AppError } from "../utils/AppError";

jest.mock("../utils/imageUpload", () => ({
  saveImageFromDataUrl: jest.fn(),
}));

function buildResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe("MessageUploadController", () => {
  const controller = new MessageUploadController();
  const saveImageFromDataUrl = imageUpload.saveImageFromDataUrl as jest.Mock;

  beforeEach(() => {
    saveImageFromDataUrl.mockReset();
  });

  it("upload() retorna 201 com imageUrl válida", async () => {
    saveImageFromDataUrl.mockReturnValue("/api/uploads/foto.png");

    const req = {
      body: { dataUrl: "data:image/png;base64,abc" },
    } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.upload(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ imageUrl: "/api/uploads/foto.png" });
    expect(next).not.toHaveBeenCalled();
  });

  it("upload() repassa erro 400 quando a imagem é inválida", async () => {
    saveImageFromDataUrl.mockImplementation(() => {
      throw new Error("Formato de imagem inválido");
    });

    const req = {
      body: { dataUrl: "data:image/png;base64,abc" },
    } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.upload(req, res as any, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(400);
  });

  it("upload() repassa erro de validação quando dataUrl está ausente", async () => {
    const req = { body: {} } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.upload(req, res as any, next);

    expect(next).toHaveBeenCalled();
    expect(saveImageFromDataUrl).not.toHaveBeenCalled();
  });
});
