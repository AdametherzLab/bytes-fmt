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

  it("formats IEC units (KiB, MiB, GiB, TiB)", () => {
    expect(formatBytes(1024, { unitSystem: 'iec' }).formatted).toBe("1 KiB");
    expect(formatBytes(1048576, { unitSystem: 'iec' }).formatted).toBe("1 MiB");
    expect(formatBytes(1073741824, { unitSystem: 'iec' }).formatted).toBe("1 GiB");
  });

  it("respects precision option", () => {
    expect(formatBytes(1536, { precision: 2 }).formatted).toBe("1.54 KB");
    expect(formatBytes(1536, { precision: 0 }).formatted).toBe("2 KB");
    expect(formatBytes(1500, { precision: 3 }).formatted).toBe("1.5 KB");
  });

  it("respects separator option", () => {
    expect(formatBytes(1000, { separator: '' }).formatted).toBe("1KB");
    expect(formatBytes(1000, { separator: '-' }).formatted).toBe("1-KB");
  });

  it("returns correct value and unit in result", () => {
    const result = formatBytes(1500);
    expect(result.value).toBe(1500);
    expect(result.unit).toBe("KB");
  });

  it("handles negative bytes", () => {
    expect(formatBytes(-1500).formatted).toBe("-1.5 KB");
  });

  it("throws on non-finite input", () => {
    expect(() => formatBytes(Infinity)).toThrow();
    expect(() => formatBytes(NaN)).toThrow();
  });

  it("throws on invalid precision", () => {
    expect(() => formatBytes(100, { precision: -1 })).toThrow();
    expect(() => formatBytes(100, { precision: 1.5 })).toThrow();
  });

  it("throws on invalid unitSystem without customUnits", () => {
    expect(() => formatBytes(500, { unitSystem: 'custom' }))
      .toThrow("unitSystem must be 'si' or 'iec' when no customUnits are provided.");
  });
});

describe("formatString", () => {
  it("returns just the formatted string", () => {
    expect(formatString(1500)).toBe("1.5 KB");
    expect(formatString(0)).toBe("0 B");
    expect(formatString(1048576, { unitSystem: 'iec' })).toBe("1 MiB");
  });
});

describe("parseBytes", () => {
  it("parses SI units", () => {
    expect(parseBytes("1.5 MB").value).toBe(1500000);
    expect(parseBytes("1 KB").value).toBe(1000);
    expect(parseBytes("2 GB").value).toBe(2000000000);
    expect(parseBytes("500 B").value).toBe(500);
  });

  it("parses IEC units", () => {
    expect(parseBytes("2GiB").value).toBe(2147483648);
    expect(parseBytes("1 KiB").value).toBe(1024);
    expect(parseBytes("1 MiB").value).toBe(1048576);
  });

  it("returns correct unit", () => {
    expect(parseBytes("1.5 MB").unit).toBe("MB");
    expect(parseBytes("2GiB").unit).toBe("GiB");
  });

  it("handles case-insensitive units", () => {
    expect(parseBytes("1 kb").value).toBe(1000);
    expect(parseBytes("1 mb").value).toBe(1000000);
  });

  it("throws on empty/invalid input", () => {
    expect(() => parseBytes("")).toThrow();
    expect(() => parseBytes("abc")).toThrow();
    expect(() => parseBytes("1.5")).toThrow();
  });

  it("throws on negative values", () => {
    expect(() => parseBytes("-1 MB")).toThrow("Byte value cannot be negative");
  });

  it("throws on unknown units", () => {
    expect(() => parseBytes("1 XB")).toThrow();
  });

  it("parses with custom units", () => {
    const custom = [{ symbol: 'BLOCK', base: 512, exponent: 1 }] as const;
    expect(parseBytes("4 BLOCK", { customUnits: custom }).value).toBe(2048);
    expect(parseBytes("4 BLOCK", { customUnits: custom }).unit).toBe("BLOCK");
  });
});

describe("roundTo", () => {
  it("rounds to specified decimal places", () => {
    expect(roundTo(3.14159, 2)).toBe(3.14);
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(1.23456)).toBe(1.2);
  });

  it("rounds to zero decimal places", () => {
    expect(roundTo(1.7, 0)).toBe(2);
    expect(roundTo(1.4, 0)).toBe(1);
  });
});

describe("getUnitEntry", () => {
  it("finds SI units", () => {
    const entry = getUnitEntry('MB', 'si');
    expect(entry).toBeDefined();
    expect(entry!.base).toBe(1000);
    expect(entry!.exponent).toBe(2);
  });

  it("finds IEC units", () => {
    const entry = getUnitEntry('GiB', 'iec');
    expect(entry).toBeDefined();
    expect(entry!.base).toBe(1024);
    expect(entry!.exponent).toBe(3);
  });

  it("returns undefined for non-matching system", () => {
    expect(getUnitEntry('MB', 'iec')).toBeUndefined();
    expect(getUnitEntry('MiB', 'si')).toBeUndefined();
  });

  it("finds any unit without system filter", () => {
    expect(getUnitEntry('MB')).toBeDefined();
    expect(getUnitEntry('GiB')).toBeDefined();
  });

  it("is case-insensitive", () => {
    expect(getUnitEntry('mb')).toBeDefined();
    expect(getUnitEntry('KB')).toBeDefined();
  });
});

describe("UNIT_TABLE", () => {
  it("contains both SI and IEC units", () => {
    const siUnits = UNIT_TABLE.filter(u => u.base === 1000);
    const iecUnits = UNIT_TABLE.filter(u => u.base === 1024);
    expect(siUnits.length).toBeGreaterThan(0);
    expect(iecUnits.length).toBeGreaterThan(0);
  });

  it("has B as the first entry", () => {
    expect(UNIT_TABLE[0].symbol).toBe('B');
    expect(UNIT_TABLE[0].exponent).toBe(0);
  });
});

describe("Custom Units", () => {
  const customUnits = [
    { symbol: 'MyUnit', base: 500, exponent: 1 },
    { symbol: 'Kb', base: 1000, exponent: 1 },
  ] as const;

  it("formats with custom units", () => {
    const result = formatBytes(500, { customUnits });
    expect(result.formatted).toBe("1 MyUnit");
    expect(result.unit).toBe("MyUnit");
  });

  it("uses custom units over built-in for formatting", () => {
    const result = formatBytes(1000, { customUnits });
    expect(result.unit).toBe("Kb");
  });

  it("parses custom units", () => {
    const parsed = parseBytes("3 MyUnit", { customUnits });
    expect(parsed.value).toBe(1500);
  });
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

  it("formats higher exponent custom units", () => {
    const result = formatBytes(250000, { unitSystem: 'custom', customUnits });
    expect(result.formatted).toBe("1 Bar");
  });
});

describe("transferTime", () => {
  it("calculates transfer time correctly", () => {
    const result = transferTime(1_000_000, 8_000_000);
    expect(result.seconds).toBe(1);
    expect(result.display).toBe("1s");
    expect(result.bytes).toBe(1_000_000);
    expect(result.bitsPerSecond).toBe(8_000_000);
  });

  it("formats milliseconds for fast transfers", () => {
    const result = transferTime(100, 8_000_000);
    expect(result.display).toMatch(/ms$/);
  });

  it("formats minutes and seconds", () => {
    const result = transferTime(100_000_000, 8_000_000);
    expect(result.display).toBe("1m 40s");
  });

  it("formats hours", () => {
    const result = transferTime(10_000_000_000, 8_000_000);
    expect(result.display).toMatch(/h/);
  });

  it("formats days for very large transfers", () => {
    const result = transferTime(1_000_000_000_000, 8_000_000);
    expect(result.display).toMatch(/d/);
  });

  it("throws on invalid bytes", () => {
    expect(() => transferTime(-1, 100)).toThrow();
    expect(() => transferTime(Infinity, 100)).toThrow();
  });

  it("throws on invalid speed", () => {
    expect(() => transferTime(100, 0)).toThrow();
    expect(() => transferTime(100, -1)).toThrow();
  });
});

describe("storageCompare", () => {
  it("compares storage items with bars", () => {
    const result = storageCompare([
      { label: "Small", bytes: 100 },
      { label: "Large", bytes: 1000 },
    ]);
    expect(result.items).toHaveLength(2);
    expect(result.items[1].percent).toBe(100);
    expect(result.items[0].percent).toBe(10);
    expect(result.display).toContain("Small");
    expect(result.display).toContain("Large");
  });

  it("returns empty for no items", () => {
    const result = storageCompare([]);
    expect(result.items).toHaveLength(0);
    expect(result.display).toBe('');
  });

  it("includes formatted byte strings", () => {
    const result = storageCompare([
      { label: "DVD", bytes: 4_700_000_000 },
    ]);
    expect(result.items[0].formatted).toBe("4.7 GB");
    expect(result.items[0].percent).toBe(100);
  });
});

describe("formatBitRate", () => {
  it("formats common bit rates", () => {
    expect(formatBitRate(100_000_000).formatted).toBe("100 Mbps");
    expect(formatBitRate(1_000_000_000).formatted).toBe("1 Gbps");
    expect(formatBitRate(1000).formatted).toBe("1 Kbps");
  });

  it("includes bytes per second equivalent", () => {
    const result = formatBitRate(800);
    expect(result.rawBytesPerSecond).toBe(100);
    expect(result.bitsPerSecond).toBe(800);
  });

  it("respects precision", () => {
    const result = formatBitRate(1_500_000, 2);
    expect(result.formatted).toBe("1.5 Mbps");
  });

  it("throws on invalid input", () => {
    expect(() => formatBitRate(-1)).toThrow();
    expect(() => formatBitRate(Infinity)).toThrow();
  });
});

describe("parseSpeed", () => {
  it("parses speed strings", () => {
    expect(parseSpeed("100 Mbps")).toBe(100_000_000);
    expect(parseSpeed("1 Gbps")).toBe(1_000_000_000);
    expect(parseSpeed("56 Kbps")).toBe(56_000);
  });

  it("is case-insensitive", () => {
    expect(parseSpeed("100 mbps")).toBe(100_000_000);
  });

  it("throws on invalid format", () => {
    expect(() => parseSpeed("")).toThrow();
    expect(() => parseSpeed("fast")).toThrow();
    expect(() => parseSpeed("100 xyz")).toThrow();
  });
});

describe("SPEED_PRESETS", () => {
  it("has expected preset values", () => {
    expect(SPEED_PRESETS['56k']).toBe(56_000);
    expect(SPEED_PRESETS['gigabit']).toBe(1_000_000_000);
    expect(SPEED_PRESETS['100mbps']).toBe(100_000_000);
  });
});

describe("SIZE_PRESETS", () => {
  it("has expected preset values", () => {
    expect(SIZE_PRESETS['floppy']).toBe(1_474_560);
    expect(SIZE_PRESETS['cd']).toBe(700_000_000);
    expect(SIZE_PRESETS['dvd']).toBe(4_700_000_000);
    expect(SIZE_PRESETS['ssd1tb']).toBe(1_000_000_000_000);
  });
});
