import { describe, it, expect } from "vitest";
import { api } from "../services/api";

describe("api", () => {
  it("usa baseURL padrão /api", () => {
    expect(api.defaults.baseURL).toBe("/api");
  });

  it("envia cookies nas requisições (withCredentials)", () => {
    expect(api.defaults.withCredentials).toBe(true);
  });
});
