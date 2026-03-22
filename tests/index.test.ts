import { describe, it, expect } from "bun:test";
import { formatBytes, formatString, parseBytes, roundTo, getUnitEntry, UNIT_TABLE, transferTime, storageCompare, formatBitRate, parseSpeed, SPEED_PRESETS, SIZE_PRESETS } from '../src/index';

describe("formatBytes", () => {
  it("formats SI units at various magnitudes (B, KB, MB, GB, TB)", () => {
    expect(formatBytes(0).formatted).toBe("0 B");
    expect(formatBytes(500).formatted).toBe("500 B");
    expect(formatBytes(1000).formatted).toBe("1 KB");
    expect(formatBytes(1500).formatted).toBe("1.5 KB");
    expect(formatBytes(1000000).formatted).toBe("1 MB");
    expect(formatBytes(1500000).formatted).toBe("1.5 MB");
    expect(formatBytes(1000000000).formatted).toBe("1 GB");
    expect(formatBytes(1000000000000).formatted).toBe("1 TB");
  });

  // ... existing tests ...
});

describe("Custom Units", () => {
  const customUnits = [
    { symbol: 'MyUnit', base: 500, exponent: 1 },
    { symbol: 'Kb', base: 1000, exponent: 1 },
  ] as const;

  // ... existing custom unit tests ...
});

describe("Configurable Unit Systems", () => {
  const customUnits = [
    { symbol: 'Foo', base: 500, exponent: 1 },
    { symbol: 'Bar', base: 500, exponent: 2 },
  ] as const;

  it("uses custom unit system when provided with unitSystem and customUnits", () => {
    const result = formatBytes(500, { unitSystem: 'custom', customUnits });
    expect(result.formatted).toBe("1 Foo");
  });

  it("throws when using custom unit system without providing customUnits", () => {
    expect(() => formatBytes(500, { unitSystem: 'custom' }))
      .toThrow("unitSystem must be 'si' or 'iec' when no customUnits are provided.");
  });

  it("prioritizes custom unit system over predefined systems", () => {
    const units = [
      { symbol: 'KB', base: 1024, exponent: 1 },
      { symbol: 'MB', base: 1000, exponent: 2 },
    ] as const;
    const parsed = parseBytes("1KB", { customUnits: units });
    expect(parsed.value).toBe(1024);
  });

  it("allows custom system units to be combined with predefined systems", () => {
    const combinedUnits = [
      ...customUnits,
      { symbol: 'KB', base: 1000, exponent: 1 },
    ] as const;
    const result = parseBytes("2 Foo", { customUnits: combinedUnits });
    expect(result.value).toBe(1000);
    expect(result.unit).toBe("Foo");
  });
});

// ... remaining existing tests ...
