import { describe, it, expect } from "bun:test";
import { formatBytes, formatString, parseBytes, roundTo, getUnitEntry, UNIT_TABLE } from '../src/index';

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