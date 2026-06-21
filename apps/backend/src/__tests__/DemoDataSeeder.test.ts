import { shouldAutoSeedDemoData } from "../services/DemoDataSeeder";

describe("DemoDataSeeder.shouldAutoSeedDemoData", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("ativa em development por padrão", () => {
    process.env.NODE_ENV = "development";
    delete process.env.SEED_DEMO_DATA;
    expect(shouldAutoSeedDemoData()).toBe(true);
  });

  it("desliga quando SEED_DEMO_DATA=false", () => {
    process.env.NODE_ENV = "development";
    process.env.SEED_DEMO_DATA = "false";
    expect(shouldAutoSeedDemoData()).toBe(false);
  });

  it("desliga em production por padrão", () => {
    process.env.NODE_ENV = "production";
    delete process.env.SEED_DEMO_DATA;
    expect(shouldAutoSeedDemoData()).toBe(false);
  });

  it("liga em production só com SEED_DEMO_DATA=true", () => {
    process.env.NODE_ENV = "production";
    process.env.SEED_DEMO_DATA = "true";
    expect(shouldAutoSeedDemoData()).toBe(true);
  });
});
