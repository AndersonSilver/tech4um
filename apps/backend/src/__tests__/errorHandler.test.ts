import { Request, Response, NextFunction } from "express";
import { ZodError, z } from "zod";
import { errorHandler } from "../middlewares/errorHandler";
import { AppError } from "../utils/AppError";

function buildReq(method = "GET", url = "/test") {
  return { method, originalUrl: url } as Request;
}

function buildRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res as unknown as Response;
}

describe("errorHandler", () => {
  it("retorna 400 com issues para ZodError", () => {
    const schema = z.object({ email: z.string().email() });
    let zodError: ZodError;
    try {
      schema.parse({ email: "invalido" });
    } catch (error) {
      zodError = error as ZodError;
    }

    const res = buildRes();
    errorHandler(zodError!, buildReq("POST", "/auth/register"), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Dados inválidos", issues: expect.any(Array) })
    );
  });

  it("retorna statusCode de AppError", () => {
    const res = buildRes();
    errorHandler(new AppError("Não autorizado", 401), buildReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Não autorizado" });
  });

  it("retorna 413 para payload too large", () => {
    const res = buildRes();
    const error = Object.assign(new Error("request entity too large"), { type: "entity.too.large" });
    errorHandler(error, buildReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(413);
  });

  it("retorna 500 para erros desconhecidos", () => {
    const res = buildRes();
    errorHandler(new Error("boom"), buildReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Erro interno do servidor" });
  });
});
