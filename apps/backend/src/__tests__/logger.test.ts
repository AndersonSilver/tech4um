import { logger } from "../utils/logger";

describe("logger", () => {
  const logSpy = jest.spyOn(console, "log").mockImplementation();
  const warnSpy = jest.spyOn(console, "warn").mockImplementation();
  const errorSpy = jest.spyOn(console, "error").mockImplementation();

  afterEach(() => {
    logSpy.mockClear();
    warnSpy.mockClear();
    errorSpy.mockClear();
  });

  afterAll(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("info formata mensagem com timestamp e nível", () => {
    logger.info("servidor iniciado");
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/\[INFO\] servidor iniciado/));
  });

  it("warn inclui meta serializado quando fornecido", () => {
    logger.warn("falha parcial", { code: 42 });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"code":42'));
  });

  it("error registra no console.error", () => {
    logger.error("erro crítico");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/\[ERROR\] erro crítico/));
  });
});
