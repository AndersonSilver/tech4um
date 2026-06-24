import { AppError } from "../utils/AppError";

describe("AppError", () => {
  it("herda de Error e guarda statusCode", () => {
    const error = new AppError("Algo deu errado", 403);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe("Algo deu errado");
    expect(error.statusCode).toBe(403);
  });

  it("usa status 400 por padrão", () => {
    const error = new AppError("Validação falhou");
    expect(error.statusCode).toBe(400);
  });
});
