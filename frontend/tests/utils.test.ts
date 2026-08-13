import { describe, it, expect } from "vitest";
import {
  formatXlm,
  shortAddr,
  calculatePayout,
  formatReputation,
  timeUntilNextRound,
  progressPercent,
  xlmToStroops,
  stroopsToNumber,
  cx,
} from "../src/lib/utils";

describe("formatXlm", () => {
  it("converts stroops to XLM (trailing zeros trimmed)", () => {
    expect(formatXlm(10_000_000)).toBe("1");
  });

  it("handles large i128 values passed as strings", () => {
    // 1,000,000,000,000,000 stroops = 100,000,000 XLM
    expect(formatXlm("1000000000000000")).toBe("100000000");
  });

  it("handles fractional amounts", () => {
    // 15,000,000 stroops = 1.5 XLM (trailing zero trimmed)
    expect(formatXlm(15_000_000)).toBe("1.5");
  });

  it("handles zero", () => {
    expect(formatXlm(0)).toBe("0");
  });

  it("handles negative values", () => {
    expect(formatXlm(-10_000_000)).toBe("-1");
  });

  it("supports custom decimals", () => {
    expect(formatXlm(10_000_000, 0)).toBe("1");
    expect(formatXlm(15_000_000, 1)).toBe("1.5");
    expect(formatXlm(15_500_000, 2)).toBe("1.55");
  });

  it("handles bigint input", () => {
    expect(formatXlm(50_000_000n)).toBe("5");
  });
});

describe("shortAddr", () => {
  const addr = "GCW5Q5X2KOZRUUT2A6V54SIHLPKA3BD3HGXEGKSRI6E5EGPPT4EVIUJY";

  it("abbreviates long addresses with 4+4 by default", () => {
    const result = shortAddr(addr);
    expect(result).toContain("…");
    expect(result.startsWith("GCW5")).toBe(true);
    expect(result.endsWith("IUJY")).toBe(true);
  });

  it("respects custom head and tail lengths", () => {
    const result = shortAddr(addr, 6, 6);
    expect(result.startsWith("GCW5Q5")).toBe(true);
    expect(result.endsWith("EVIUJY")).toBe(true);
  });

  it("returns short strings unchanged", () => {
    expect(shortAddr("ABC")).toBe("ABC");
  });

  it("returns empty string for empty input", () => {
    expect(shortAddr("")).toBe("");
  });
});

describe("calculatePayout", () => {
  it("computes total pot = contribution * member count", () => {
    // 5 members, 10 XLM each (100,000,000 stroops) = 500,000,000 stroops
    expect(calculatePayout(100_000_000, 5)).toBe(500_000_000n);
  });

  it("works with string contribution amounts", () => {
    // 10 members, 50 XLM each (500,000,000 stroops) = 5,000,000,000 stroops
    expect(calculatePayout("500000000", 10)).toBe(5_000_000_000n);
  });

  it("returns 0n for zero members", () => {
    expect(calculatePayout(100_000_000, 0)).toBe(0n);
  });

  it("handles bigint contribution", () => {
    expect(calculatePayout(200_000_000n, 3)).toBe(600_000_000n);
  });
});

describe("formatReputation", () => {
  it("labels excellent reputation (>= 90)", () => {
    const r = formatReputation(200);
    expect(r.label).toBe("Excellent");
    expect(r.color).toBe("text-emerald-600");
  });

  it("labels good reputation (>= 70)", () => {
    const r = formatReputation(75);
    expect(r.label).toBe("Good");
    expect(r.color).toBe("text-brand-600");
  });

  it("labels fair reputation (>= 50)", () => {
    const r = formatReputation(55);
    expect(r.label).toBe("Fair");
    expect(r.color).toBe("text-amber-600");
  });

  it("labels at-risk reputation (>= 40)", () => {
    const r = formatReputation(42);
    expect(r.label).toBe("At Risk");
    expect(r.color).toBe("text-orange-600");
  });

  it("labels poor reputation (< 40)", () => {
    const r = formatReputation(20);
    expect(r.label).toBe("Poor");
    expect(r.color).toBe("text-red-600");
  });

  it("computes stars from score (max 5)", () => {
    expect(formatReputation(100).stars).toBe(5);
    expect(formatReputation(50).stars).toBe(3); // 50/20 = 2.5 -> round -> 3
    expect(formatReputation(0).stars).toBe(0);
  });
});

describe("timeUntilNextRound", () => {
  const WEEK = 7 * 24 * 60 * 60 * 1000;

  it("returns 'Now' for past timestamps", () => {
    const now = Date.now();
    const roundStart = now - WEEK - 1000;
    expect(timeUntilNextRound(now, roundStart)).toBe("Now");
  });

  it("formats minutes when < 1 hour", () => {
    const now = 1_000_000;
    const roundStart = now - WEEK + 5 * 60 * 1000; // 5 min left
    expect(timeUntilNextRound(now, roundStart)).toBe("5m");
  });

  it("formats hours and minutes", () => {
    const now = 1_000_000;
    const remaining = 3 * 60 * 60 * 1000 + 30 * 60 * 1000; // 3h 30m
    const roundStart = now - WEEK + remaining;
    expect(timeUntilNextRound(now, roundStart)).toBe("3h 30m");
  });

  it("formats days and hours", () => {
    const now = 1_000_000;
    const remaining = 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000; // 2d 4h
    const roundStart = now - WEEK + remaining;
    expect(timeUntilNextRound(now, roundStart)).toBe("2d 4h");
  });
});

describe("progressPercent", () => {
  it("returns 0 at round 1 of any cycle", () => {
    expect(progressPercent(1, 5)).toBe(0);
  });

  it("returns 100 when all rounds complete", () => {
    expect(progressPercent(6, 5)).toBe(100);
  });

  it("returns 50 at round 3 of 4", () => {
    expect(progressPercent(3, 4)).toBe(50);
  });

  it("returns 0 for zero cycles", () => {
    expect(progressPercent(1, 0)).toBe(0);
  });
});

describe("xlmToStroops", () => {
  it("converts XLM to stroops", () => {
    expect(xlmToStroops(1)).toBe(10_000_000n);
    expect(xlmToStroops("10.5")).toBe(105_000_000n);
  });

  it("returns 0n for invalid input", () => {
    expect(xlmToStroops(NaN)).toBe(0n);
    expect(xlmToStroops(-5)).toBe(0n);
  });
});

describe("stroopsToNumber", () => {
  it("converts stroops to XLM number", () => {
    expect(stroopsToNumber(10_000_000)).toBe(1);
    expect(stroopsToNumber("500000000")).toBe(50);
  });

  it("handles bigint", () => {
    expect(stroopsToNumber(100_000_000n)).toBe(10);
  });
});

describe("cx", () => {
  it("joins truthy class names", () => {
    expect(cx("foo", "bar")).toBe("foo bar");
  });

  it("drops falsy values", () => {
    expect(cx("foo", false, null, undefined, "bar")).toBe("foo bar");
  });

  it("returns empty string for all falsy", () => {
    expect(cx(false, null, undefined)).toBe("");
  });
});
