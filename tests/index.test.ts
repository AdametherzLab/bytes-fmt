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

  it("formats IEC units (KiB, MiB, GiB) with binary base 1024", () => {
    expect(formatBytes(1024, { unitSystem: "iec" }).formatted).toBe("1 KiB");
    expect(formatBytes(1536, { unitSystem: "iec" }).formatted).toBe("1.5 KiB");
    expect(formatBytes(1048576, { unitSystem: "iec" }).formatted).toBe("1 MiB");
    expect(formatBytes(1572864, { unitSystem: "iec" }).formatted).toBe("1.5 MiB");
    expect(formatBytes(1073741824, { unitSystem: "iec" }).formatted).toBe("1 GiB");
  });

  it("applies custom decimal precision and separator options", () => {
    expect(formatBytes(1234, { precision: 0 }).formatted).toBe("1 KB");
    expect(formatBytes(1234, { precision: 3 }).formatted).toBe("1.234 KB");
    expect(formatBytes(1234, { separator: "" }).formatted).toBe("1.23KB");
    expect(formatBytes(1234, { separator: "_" }).formatted).toBe("1.23_KB");
    expect(formatBytes(1234, { precision: 1, separator: "-" }).formatted).toBe("1.2-KB");
  });

  it("parses byte strings with round-trip accuracy and case-insensitive input", () => {
    const siResult = parseBytes("1.5 MB");
    expect(siResult.value).toBe(1500000);
    expect(siResult.unit).toBe("MB");
    
    const iecResult = parseBytes("2GiB");
    expect(iecResult.value).toBe(2147483648);
    expect(iecResult.unit).toBe("GiB");
    
    const lowerCase = parseBytes("500 kb");
    expect(lowerCase.value).toBe(500000);
    expect(lowerCase.unit).toBe("KB");
    
    const mixedCase = parseBytes("3mB");
    expect(mixedCase.value).toBe(3000000);
    expect(mixedCase.unit).toBe("MB");
  });

  it("handles edge cases for zero, negative values, and throws on invalid parse input", () => {
    expect(formatBytes(0).formatted).toBe("0 B");
    expect(formatBytes(-1024).formatted).toBe("-1 KB");
    expect(formatBytes(-1048576, { unitSystem: "iec" }).formatted).toBe("-1 MiB");
    
    expect(() => parseBytes("")).toThrow();
    expect(() => parseBytes("abc")).toThrow();
    expect(() => parseBytes("12 ZB")).toThrow();
    
    const errorMsg = expect(() => parseBytes("invalid")).toThrow();
    expect(errorMsg).toBeDefined();
  });
});

// --- v0.2.0: Transfer Time ---

describe("transferTime", () => {
  it("calculates seconds for simple transfer", () => {
    // 1 MB at 8 Mbps = 1 second
    const result = transferTime(1_000_000, 8_000_000);
    expect(result.seconds).toBe(1);
    expect(result.display).toBe("1s");
  });

  it("shows minutes and seconds", () => {
    // 100 MB at 10 Mbps = 80 seconds
    const result = transferTime(100_000_000, 10_000_000);
    expect(result.seconds).toBe(80);
    expect(result.display).toBe("1m 20s");
  });

  it("shows hours for large transfers", () => {
    // 10 GB at 10 Mbps = 8000 seconds ≈ 2h 13m
    const result = transferTime(10_000_000_000, 10_000_000);
    expect(result.seconds).toBe(8000);
    expect(result.display).toInclude("h");
  });

  it("shows milliseconds for tiny transfers", () => {
    const result = transferTime(100, 1_000_000_000);
    expect(result.display).toInclude("ms");
  });

  it("shows days for huge transfers on slow links", () => {
    // 1 TB at 1 Mbps
    const result = transferTime(1_000_000_000_000, 1_000_000);
    expect(result.display).toInclude("d");
  });

  it("throws on invalid input", () => {
    expect(() => transferTime(-1, 1000)).toThrow();
    expect(() => transferTime(1000, 0)).toThrow();
    expect(() => transferTime(1000, -1)).toThrow();
  });

  it("returns correct metadata", () => {
    const result = transferTime(500, 4000);
    expect(result.bytes).toBe(500);
    expect(result.bitsPerSecond).toBe(4000);
  });
});

// --- v0.2.0: Storage Compare ---

describe("storageCompare", () => {
  it("compares multiple storage sizes", () => {
    const result = storageCompare([
      { label: "DVD", bytes: 4_700_000_000 },
      { label: "Blu-ray", bytes: 25_000_000_000 },
      { label: "CD", bytes: 700_000_000 },
    ]);
    expect(result.items.length).toBe(3);
    expect(result.display).toInclude("DVD");
    expect(result.display).toInclude("Blu-ray");
    expect(result.display).toInclude("█");
  });

  it("shows 100% for largest item", () => {
    const result = storageCompare([
      { label: "Small", bytes: 100 },
      { label: "Large", bytes: 1000 },
    ]);
    const large = result.items.find(i => i.label === "Large");
    expect(large?.percent).toBe(100);
  });

  it("shows relative percentages", () => {
    const result = storageCompare([
      { label: "Half", bytes: 500 },
      { label: "Full", bytes: 1000 },
    ]);
    const half = result.items.find(i => i.label === "Half");
    expect(half?.percent).toBe(50);
  });

  it("handles empty input", () => {
    const result = storageCompare([]);
    expect(result.items.length).toBe(0);
    expect(result.display).toBe("");
  });

  it("handles single item", () => {
    const result = storageCompare([{ label: "SSD", bytes: 256_000_000_000 }]);
    expect(result.items.length).toBe(1);
    expect(result.items[0].percent).toBe(100);
  });

  it("includes formatted size strings", () => {
    const result = storageCompare([{ label: "Test", bytes: 1_000_000 }]);
    expect(result.items[0].formatted).toBe("1 MB");
  });

  it("supports custom bar width", () => {
    const result = storageCompare([{ label: "X", bytes: 100 }], 10);
    expect(result.items[0].bar.length).toBe(10);
  });
});

// --- v0.2.0: Bit-Rate Formatter ---

describe("formatBitRate", () => {
  it("formats bps", () => {
    expect(formatBitRate(500).formatted).toBe("500 bps");
  });

  it("formats Kbps", () => {
    expect(formatBitRate(56_000).formatted).toBe("56 Kbps");
  });

  it("formats Mbps", () => {
    expect(formatBitRate(100_000_000).formatted).toBe("100 Mbps");
  });

  it("formats Gbps", () => {
    expect(formatBitRate(1_000_000_000).formatted).toBe("1 Gbps");
  });

  it("includes bytes per second equivalent", () => {
    const result = formatBitRate(8_000_000);
    expect(result.rawBytesPerSecond).toBe(1_000_000);
    expect(result.bytesPerSecond).toInclude("MB");
  });

  it("respects precision", () => {
    const result = formatBitRate(1_500_000, 2);
    expect(result.formatted).toBe("1.5 Mbps");
  });

  it("throws on invalid input", () => {
    expect(() => formatBitRate(-1)).toThrow();
  });
});

describe("parseSpeed", () => {
  it("parses Mbps", () => {
    expect(parseSpeed("100 Mbps")).toBe(100_000_000);
  });

  it("parses Gbps", () => {
    expect(parseSpeed("1 Gbps")).toBe(1_000_000_000);
  });

  it("parses Kbps case-insensitive", () => {
    expect(parseSpeed("56 kbps")).toBe(56_000);
  });

  it("throws on invalid format", () => {
    expect(() => parseSpeed("fast")).toThrow();
  });
});

describe("presets", () => {
  it("SPEED_PRESETS has expected keys", () => {
    expect(SPEED_PRESETS["100mbps"]).toBe(100_000_000);
    expect(SPEED_PRESETS.gigabit).toBe(1_000_000_000);
  });

  it("SIZE_PRESETS has expected keys", () => {
    expect(SIZE_PRESETS.dvd).toBe(4_700_000_000);
    expect(SIZE_PRESETS.ssd1tb).toBe(1_000_000_000_000);
  });
});