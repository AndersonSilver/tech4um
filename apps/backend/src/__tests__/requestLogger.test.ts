import { Request, Response, NextFunction } from "express";
import { requestLogger } from "../middlewares/requestLogger";
import { logger } from "../utils/logger";

jest.mock("../utils/logger", () => ({
  logger: { info: jest.fn() },
}));

describe("requestLogger", () => {
  it("registra método, URL, status e duração ao finalizar resposta", () => {
    const listeners: Record<string, Array<() => void>> = {};
    const res = {
      statusCode: 200,
      on: jest.fn((event: string, handler: () => void) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(handler);
      }),
    } as unknown as Response;

    const req = { method: "GET", originalUrl: "/forums" } as Request;
    const next = jest.fn() as NextFunction;

    requestLogger(req, res, next);

    expect(next).toHaveBeenCalled();
    listeners.finish?.forEach((handler) => handler());

    expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/GET \/forums 200 \(\d+ms\)/));
  });
});
