import { authRateLimiter, generalRateLimiter } from "../middlewares/rateLimiters";

describe("rateLimiters", () => {
  it("exporta middlewares de rate limit configurados", () => {
    expect(typeof authRateLimiter).toBe("function");
    expect(typeof generalRateLimiter).toBe("function");
    expect(authRateLimiter).not.toBe(generalRateLimiter);
  });
});
