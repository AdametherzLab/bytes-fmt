import type { UnitEntry, UnitSystem, ParseResult } from './types';

/**
 * Unit lookup table covering SI (decimal) and IEC (binary) units.
 * Each entry defines the symbol, base (1000 or 1024), and exponent.
 */
export const UNIT_TABLE: readonly UnitEntry[] = [
  // SI units (base 1000)
  { symbol: 'B', base: 1000, exponent: 0 },
  { symbol: 'KB', base: 1000, exponent: 1 },
  { symbol: 'MB', base: 1000, exponent: 2 },
  { symbol: 'GB', base: 1000, exponent: 3 },
  { symbol: 'TB', base: 1000, exponent: 4 },
  { symbol: 'PB', base: 1000, exponent: 5 },
  // IEC units (base 1024)
  { symbol: 'KiB', base: 1024, exponent: 1 },
  { symbol: 'MiB', base: 1024, exponent: 2 },
  { symbol: 'GiB', base: 1024, exponent: 3 },
  { symbol: 'TiB', base: 1024, exponent: 4 },
  { symbol: 'PiB', base: 1024, exponent: 5 },
] as const;

/**
 * Find a unit entry by its symbol (case-insensitive).
 * @param symbol - Unit symbol to look up (e.g., "KB", "MiB")
 * @param system - Optional filter by unit system ('si' or 'iec')
 * @returns The matching UnitEntry or undefined if not found
 */
export function getUnitEntry(symbol: string, system?: UnitSystem): UnitEntry | undefined {
  const normalized = symbol.toUpperCase();
  return UNIT_TABLE.find((entry) => {
    if (entry.symbol.toUpperCase() !== normalized) return false;
    if (!system) return true;
    return system === 'si' ? entry.base === 1000 : entry.base === 1024;
  });
}

/**
 * Round a number to a specific number of decimal places.
 * @param value - Number to round
 * @param decimals - Number of decimal places (default: 1)
 * @returns Rounded number
 */
export function roundTo(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Parse a byte string into a numeric value in bytes.
 * Supports formats like "1.5 MB", "2GiB", "512 kb" (case-insensitive).
 * @param input - String to parse (e.g., "1.5 MB", "2 GiB")
 * @param options - Optional parsing options including custom units
 * @returns ParseResult containing the computed byte count and detected unit
 * @throws {Error} If input is invalid or unit is unrecognized
 * @example
 * parseBytes("1.5 MB")  // { value: 1500000, unit: "MB" }
 * parseBytes("2GiB")    // { value: 2147483648, unit: "GiB" }
 */
export function parseBytes(input: string, options?: { customUnits?: readonly UnitEntry[] }): ParseResult {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw new Error('Input must be a non-empty string');
  }

  const trimmed = input.trim();
  const match = trimmed.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*([a-zA-Z]+)$/);

  if (!match) {
    throw new Error(`Invalid byte string format: "${input}". Expected format like "1.5 MB"`);
  }

  const numericPart = match[1];
  const unitPart = match[2];

  const numValue = parseFloat(numericPart);
  if (isNaN(numValue)) {
    throw new Error(`Invalid numeric value: "${numericPart}"`);
  }

  if (numValue < 0) {
    throw new Error('Byte value cannot be negative');
  }

  let entry: UnitEntry | undefined;
  const normalizedUnit = unitPart.toUpperCase();
  
  if (options?.customUnits) {
    entry = options.customUnits.find(u => u.symbol.toUpperCase() === normalizedUnit);
  }
  
  if (!entry) {
    entry = UNIT_TABLE.find(u => u.symbol.toUpperCase() === normalizedUnit);
  }

  if (!entry) {
    const allowedUnits = options?.customUnits 
      ? options.customUnits.map(u => u.symbol).join(', ') 
      : ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
    throw new Error(`Unknown unit: "${unitPart}". Supported units: ${allowedUnits.join(', ')}`);
  }

  const byteValue = numValue * Math.pow(entry.base, entry.exponent);

  return {
    value: byteValue,
    unit: entry.symbol,
  };
}
