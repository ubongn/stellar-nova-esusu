import { describe, it, expect } from "vitest";
import {
  formatXlm,
  shortAddr,
  calculatePayout,
  formatReputation,
  timeUntilNextRound,
  cn,
  validateAmount,
  validateSize,
  validateName,
  stroopsToXlm,
  xlmToStroops,
  clamp,
} from "../src/lib/utils";

describe("formatXlm", () => {
  it("converts stroops to XLM", () => {
    expect(formatXlm(10_000_000)).toBe("1");
  });

  it("handles large i128 values passed as strings", () => {
    // 1,000,000,000,000,000 stroops = 100,000,000 XLM
    expect(formatXlm("1000000000000000")).toBe("100,000,000");
  });

  it("handles fractional amounts", () => {
    // 15,000,000 stroops = 1.5 XLM
    expect(formatXlm(15_000_000)).toBe("1.5");
  });

  it("handles string input with quotes (from scval decoding)", () => {
    expect(formatXlm('"10000000"')).toBe("1");
  });

  it("handles zero", () => {
    expect(formatXlm(0)).toBe("0");
  });
});

describe("shortAddr", () => {
  const addr = "GCW5Q5X2KOZRUUT2A6V54SIHLPKA3BD3HGXEGKSRI6E5EGPPT4EVIUJY";

  it("abbreviates long addresses", () => {
    const result = shortAddr(addr);
    expect(result).toHaveLength(2 * 4 + 1 + 2); // GCW5…IUJY-ish
    expect(result).toContain("…");
    expect(result.startsWith("GC")).toBe(true);
    expect(result.endsWith("IUJY")).toBe(true);
  });

  it("respects custom char length", () => {
    const result = shortAddr(addr, 6);
    expect(result.startsWith("GCW5Q5")).toBe(true);
    expect(result.endsWith("EVIUJY")).toBe(true);
  });

  it("returns short strings unchanged", () => {
    expect(shortAddr("ABC")).toBe("ABC");
  });

  it("returns empty for nullish", () => {
    expect(shortAddr(null)).toBe("");
    expect(shortAddr(undefined)).toBe("");
    expect(shortAddr("")).toBe("");
  });
});

describe("calculatePayout", () => {
  it("computes total pot = size * contribution", () => {
    // 5 members, 10 XLM each (100,000,000 stroops)
    expect(calculatePayout(5, 100_000_000)).toBe(50);
  });

  it("works with string contribution amounts", () => {
    expect(calculatePayout(10, "500000000")).toBe(500);
  });

  it("returns 0 for size 0", () => {
    expect(calculatePayout(0, 100_000_000)).toBe(0);
  });
});

describe("formatReputation", () => {
  it("labels excellent reputation", () => {
    const r = formatReputation(200);
    expect(r.label).toBe("Excellent");
    expect(r.color).toBe("text-emerald-600");
  });

  it("labels good reputation", () => {
    const r = formatReputation(120);
    expect(r.label).toBe("Good");
    expect(r.color).toBe("text-brand-600");
  });

  it("labels fair reputation", () => {
    const r = formatReputation(75);
    expect(r.label).toBe("Fair");
    expect(r.color).toBe("text-amber-600");
  });

  it("labels poor reputation", () => {
    const r = formatReputation(20);
    expect(r.label).toBe("Poor");
    expect(r.color).toBe("text-red-600");
  });

  it("uses reputation object score when provided", () => {
    const r = formatReputation(0, { score: 160 } as never);
    expect(r.label).toBe("Excellent");
  });
});

describe("timeUntilNextRound", () => {
  it("returns 'Now' for past timestamps", () => {
    expect(timeUntilNextRound(Date.now() - 1000)).toBe("Now");
  });

  it("formats minutes", () => {
    const future = Date.now() + 5 * 60_000;
    expect(timeUntilNextRound(future)).toBe("5m");
  });

  it("formats hours and minutes", () => {
    const future = Date.now() + 3 * 3_600_000 + 30 * 60_000;
    expect(timeUntilNextRound(future)).toBe("3h 30m");
  });

  it("formats days", () => {
    const future = Date.now() + 2 * 86_400_000 + 4 * 3_600_000;
    expect(timeUntilNextRound(future)).toBe("2d 4h");
  });
});

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("returns empty string for all falsy", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});

describe("validateAmount", () => {
  it("accepts positive amounts", () => {
    expect(validateAmount(10).ok).toBe(true);
    expect(validateAmount(0.5).ok).toBe(true);
  });

  it("rejects zero and negative", () => {
    expect(validateAmount(0).ok).toBe(false);
    expect(validateAmount(-5).ok).toBe(false);
  });

  it("rejects NaN", () => {
    expect(validateAmount(NaN).ok).toBe(false);
  });
});

describe("validateSize", () => {
  it("requires at least 2 members", () => {
    expect(validateSize(1).ok).toBe(false);
    expect(validateSize(2).ok).toBe(true);
  });

  it("caps at 50 members", () => {
    expect(validateSize(50).ok).toBe(true);
    expect(validateSize(51).ok).toBe(false);
  });

  it("rejects non-integers", () => {
    expect(validateSize(2.5).ok).toBe(false);
  });
});

describe("validateName", () => {
  it("accepts valid names", () => {
    expect(validateName("Family Savings").ok).toBe(true);
  });

  it("rejects too-short names", () => {
    expect(validateName("A").ok).toBe(false);
  });

  it("rejects too-long names", () => {
    expect(validateName("x".repeat(65)).ok).toBe(false);
  });

  it("trims whitespace before validating", () => {
    expect(validateName("   ok   ").ok).toBe(true);
  });
});

describe("stroopsToXlm / xlmToStroops", () => {
  it("round-trips correctly", () => {
    const stroops = xlmToStroops(12.5);
    expect(stroops).toBe(125_000_000n);
    expect(stroopsToXlm(stroops)).toBe(12.5);
  });
});

describe("clamp", () => {
  it("clamps to range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});
