import type { FormatOptions, FormatResult, UnitEntry, UnitSystem } from './types';

/**
 * Round a number to a specific number of decimal places.
 * @param value - The number to round
 * @param decimals - Number of decimal places
 * @returns Rounded number
 */
function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

const SI_UNITS = [
  { symbol: 'B', base: 1000, exponent: 0 },
  { symbol: 'KB', base: 1000, exponent: 1 },
  { symbol: 'MB', base: 1000, exponent: 2 },
  { symbol: 'GB', base: 1000, exponent: 3 },
  { symbol: 'TB', base: 1000, exponent: 4 },
  { symbol: 'PB', base: 1000, exponent: 5 },
  { symbol: 'EB', base: 1000, exponent: 6 },
] satisfies readonly UnitEntry[];

const IEC_UNITS = [
  { symbol: 'B', base: 1024, exponent: 0 },
  { symbol: 'KiB', base: 1024, exponent: 1 },
  { symbol: 'MiB', base: 1024, exponent: 2 },
  { symbol: 'GiB', base: 1024, exponent: 3 },
  { symbol: 'TiB', base: 1024, exponent: 4 },
  { symbol: 'PiB', base: 1024, exponent: 5 },
  { symbol: 'EiB', base: 1024, exponent: 6 },
] satisfies readonly UnitEntry[];

/**
 * Format bytes to a human-readable string using SI or IEC units.
 * @param bytes - The number of bytes to format
 * @param options - Formatting options
 * @returns FormatResult containing formatted string, original value, and unit used
 * @throws {TypeError} If bytes is not a finite number
 * @throws {TypeError} If unitSystem is invalid
 * @throws {RangeError} If precision is invalid
 * @example
 * const result = formatBytes(1500);
 * console.log(result.formatted); // "1.5 KB"
 */
export function formatBytes(
  bytes: number,
  options?: Readonly<FormatOptions>
): FormatResult {
  if (!Number.isFinite(bytes)) {
    throw new TypeError(`bytes must be a finite number, got: ${bytes}`);
  }

  let precision = options?.precision ?? 1;
  let system: UnitSystem = options?.unitSystem ?? 'si';
  const separator = options?.separator ?? ' ';
  const customUnits = options?.customUnits;

  if (precision < 0 || !Number.isInteger(precision)) {
    throw new RangeError(`precision must be a non-negative integer, got: ${precision}`);
  }

  if (system !== 'si' && system !== 'iec' && !customUnits) {
    throw new TypeError(
      `unitSystem must be 'si' or 'iec' when no customUnits are provided. Received: '${system}'. ` +
      'To use a custom unit system, provide customUnits along with the desired unitSystem name.'
    );
  }

  const units = customUnits ?? (system === 'si' ? SI_UNITS : IEC_UNITS);
  const isNegative = bytes < 0;
  const absBytes = Math.abs(bytes);

  let selectedUnit: UnitEntry = units[0];
  let scaledValue = absBytes;

  for (const unit of units) {
    const divisor = unit.base ** unit.exponent;
    if (absBytes >= divisor) {
      selectedUnit = unit;
      scaledValue = absBytes / divisor;
    } else {
      break;
    }
  }

  const roundedValue = roundTo(scaledValue, precision);
  let formattedNumber = roundedValue.toFixed(precision)
    .replace(/(\.\d*?)(0+)$/, '$1')
    .replace(/\.$/, '');
  const signPrefix = isNegative ? '-' : '';
  const formatted = `${signPrefix}${formattedNumber}${separator}${selectedUnit.symbol}`;

  return {
    formatted,
    value: bytes,
    unit: selectedUnit.symbol,
  };
}

/**
 * Convenience function that returns only the formatted string.
 * @param bytes - The number of bytes to format
 * @param options - Formatting options
 * @returns Human-readable formatted string (e.g., "1.5 GB")
 * @example
 * const str = formatString(1024 * 1024);
 * console.log(str); // "1 MB"
 */
export function formatString(
  bytes: number,
  options?: Readonly<FormatOptions>
): string {
  return formatBytes(bytes, options).formatted;
}
