/** Unit system identifiers. */
export type UnitSystem = 'si' | 'iec' | string;

/**
 * Entry in the unit lookup table.
 * @example { symbol: "KB", base: 1000, exponent: 1 }
 */
export interface UnitEntry {
  /** Unit symbol (e.g., "KB", "MiB"). */
  readonly symbol: string;
  /** Base value (1000 for SI, 1024 for IEC). */
  readonly base: number;
  /** Power of the unit (1 = kilo, 2 = mega, etc.). */
  readonly exponent: number;
}

/**
 * Configuration options for byte formatting.
 * @example
 * // Using SI units
 * const opts: FormatOptions = { precision: 2, unitSystem: "si" };
 * // Using custom units
 * const customOptions: FormatOptions = {
 *   unitSystem: "custom",
 *   customUnits: [
 *     { symbol: "Foo", base: 1000, exponent: 1 },
 *     { symbol: "Bar", base: 1000, exponent: 2 },
 *   ],
 * };
 */
export interface FormatOptions {
  /** Number of decimal places (default: 1). */
  readonly precision?: number;
  /**
   * Unit system to use. Defaults to 'si'.
   * Can be 'si', 'iec', or a custom system name if customUnits are provided.
   */
  readonly unitSystem?: UnitSystem;
  /** Separator between value and unit (default: " "). */
  readonly separator?: string;
  /**
   * Custom unit definitions. Overrides unitSystem if provided.
   * Required if unitSystem is a custom name.
   */
  readonly customUnits?: readonly UnitEntry[];
}

/**
 * Result returned by the parse function.
 * Contains the numeric byte value and detected unit string.
 */
export interface ParseResult {
  /** Numeric value in bytes. */
  readonly value: number;
  /** Detected unit string (e.g., "KB", "GiB"). */
  readonly unit: string;
}

/**
 * Result returned by the format function.
 * Contains the formatted string and metadata.
 */
export interface FormatResult {
  /** Human-readable formatted string (e.g., "1.5 GB"). */
  readonly formatted: string;
  /** Original numeric value in bytes. */
  readonly value: number;
  /** Unit used in the formatted output. */
  readonly unit: string;
}

// --- v0.2.0: Transfer Time, Storage Compare, Bit-Rate ---

/** Result from transfer time estimation. */
export interface TransferTimeResult {
  /** Total seconds for the transfer. */
  readonly seconds: number;
  /** Human-readable duration string (e.g., "2m 30s"). */
  readonly display: string;
  /** File size in bytes. */
  readonly bytes: number;
  /** Speed in bits per second. */
  readonly bitsPerSecond: number;
}

/** A named storage item for comparison. */
export interface StorageItem {
  /** Label (e.g., "DVD", "Blu-ray"). */
  readonly label: string;
  /** Size in bytes. */
  readonly bytes: number;
}

/** Result from storage comparison. */
export interface StorageCompareResult {
  /** Sorted items with bar visualization. */
  readonly items: readonly { label: string; bytes: number; formatted: string; bar: string; percent: number }[];
  /** Full text display. */
  readonly display: string;
}

/** Result from bit-rate formatting. */
export interface BitRateResult {
  /** Human-readable bit rate (e.g., "100 Mbps"). */
  readonly formatted: string;
  /** Equivalent bytes per second formatted. */
  readonly bytesPerSecond: string;
  /** Raw bits per second. */
  readonly bitsPerSecond: number;
  /** Raw bytes per second. */
  readonly rawBytesPerSecond: number;
}
