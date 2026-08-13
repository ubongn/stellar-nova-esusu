import { describe, it, expect } from "vitest";
import { classifyError } from "../src/lib/errors";

describe("classifyError", () => {
  it("classifies wallet-not-found errors", () => {
    const c = classifyError(new Error("Freighter is not installed"));
    expect(c.category).toBe("wallet_not_found");
  });

  it("classifies connection-rejected errors", () => {
    const c = classifyError(new Error("User rejected the request"));
    expect(c.category).toBe("connection_rejected");
  });

  it("classifies insufficient-balance errors", () => {
    const c = classifyError(new Error("insufficient balance for fee"));
    expect(c.category).toBe("insufficient_balance");
  });

  it("classifies network errors", () => {
    const c = classifyError(new Error("fetch failed: timeout"));
    expect(c.category).toBe("network_error");
  });

  it("classifies contract errors", () => {
    const c = classifyError(new Error("host invocation failed: panic"));
    expect(c.category).toBe("contract_error");
  });

  it("falls back to contract_error for unknown messages", () => {
    const c = classifyError(new Error("something weird"));
    expect(c.category).toBe("contract_error");
  });
});
