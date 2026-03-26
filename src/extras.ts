import type { TransferTimeResult, StorageItem, StorageCompareResult, BitRateResult } from './types';
import { formatString } from './format';

/**
 * Estimate transfer time for a file size at a given network speed.
 * @param bytes - File size in bytes
 * @param speedBps - Network speed in bits per second (e.g., 100_000_000 for 100 Mbps)
 * @returns TransferTimeResult with duration breakdown
 */
export function transferTime(bytes: number, speedBps: number): TransferTimeResult {
  if (!Number.isFinite(bytes) || bytes < 0) {
    throw new TypeError(`bytes must be a non-negative finite number, got: ${bytes}`);
  }
  if (!Number.isFinite(speedBps) || speedBps <= 0) {
    throw new TypeError(`speedBps must be a positive finite number, got: ${speedBps}`);
  }

  const bits = bytes * 8;
  const totalSeconds = bits / speedBps;

  let display: string;
  if (totalSeconds < 1) {
    display = `${Math.round(totalSeconds * 1000)}ms`;
  } else if (totalSeconds < 60) {
    display = `${Math.round(totalSeconds)}s`;
  } else if (totalSeconds < 3600) {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.round(totalSeconds % 60);
    display = s > 0 ? `${m}m ${s}s` : `${m}m`;
  } else if (totalSeconds < 86400) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.round((totalSeconds % 3600) / 60);
    display = m > 0 ? `${h}h ${m}m` : `${h}h`;
  } else {
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.round((totalSeconds % 86400) / 3600);
    display = h > 0 ? `${d}d ${h}h` : `${d}d`;
  }

  return {
    seconds: totalSeconds,
    display,
    bytes,
    bitsPerSecond: speedBps,
  };
}

/**
 * Compare multiple storage sizes with a visual bar chart.
 * @param items - Array of labeled storage items
 * @param barWidth - Width of the bar in characters (default: 30)
 * @returns StorageCompareResult with bars and percentages
 */
export function storageCompare(items: readonly StorageItem[], barWidth: number = 30): StorageCompareResult {
  if (items.length === 0) {
    return { items: [], display: '' };
  }

  const maxBytes = Math.max(...items.map(i => i.bytes));
  const maxLabelLen = Math.max(...items.map(i => i.label.length));

  const mapped = items.map(item => {
    const percent = maxBytes === 0 ? 0 : Math.round((item.bytes / maxBytes) * 100);
    const barLen = maxBytes === 0 ? 0 : Math.round((item.bytes / maxBytes) * barWidth);
    const bar = '\u2588'.repeat(barLen) + '\u2591'.repeat(Math.max(0, barWidth - barLen));
    const formatted = formatString(item.bytes);
    return { label: item.label, bytes: item.bytes, formatted, bar, percent };
  });

  const lines = mapped.map(item => {
    const label = item.label.padEnd(maxLabelLen);
    return `${label}  ${item.bar}  ${item.formatted.padStart(8)} (${item.percent}%)`;
  });

  return {
    items: mapped,
    display: lines.join('\n'),
  };
}

/** Common network speed presets in bits per second. */
export const SPEED_PRESETS = {
  '56k': 56_000,
  'dsl': 5_000_000,
  '4g': 50_000_000,
  '100mbps': 100_000_000,
  'gigabit': 1_000_000_000,
  '5g': 1_000_000_000,
  '10gbe': 10_000_000_000,
  'wifi6': 9_600_000_000,
} as const;

/** Common storage size presets in bytes. */
export const SIZE_PRESETS = {
  'floppy': 1_474_560,
  'cd': 700_000_000,
  'dvd': 4_700_000_000,
  'bluray': 25_000_000_000,
  'usb8': 8_000_000_000,
  'usb32': 32_000_000_000,
  'usb128': 128_000_000_000,
  'ssd256': 256_000_000_000,
  'ssd1tb': 1_000_000_000_000,
  'hdd4tb': 4_000_000_000_000,
} as const;

const BIT_UNITS = [
  { symbol: 'bps', factor: 1 },
  { symbol: 'Kbps', factor: 1_000 },
  { symbol: 'Mbps', factor: 1_000_000 },
  { symbol: 'Gbps', factor: 1_000_000_000 },
  { symbol: 'Tbps', factor: 1_000_000_000_000 },
];

/**
 * Format a bit rate to human-readable string with byte/s equivalent.
 * @param bitsPerSecond - Speed in bits per second
 * @param precision - Decimal places (default: 1)
 * @returns BitRateResult with formatted strings
 */
export function formatBitRate(bitsPerSecond: number, precision: number = 1): BitRateResult {
  if (!Number.isFinite(bitsPerSecond) || bitsPerSecond < 0) {
    throw new TypeError(`bitsPerSecond must be a non-negative finite number, got: ${bitsPerSecond}`);
  }

  let selected = BIT_UNITS[0];
  for (const unit of BIT_UNITS) {
    if (bitsPerSecond >= unit.factor) {
      selected = unit;
    } else {
      break;
    }
  }

  const scaled = bitsPerSecond / selected.factor;
  const factor = 10 ** precision;
  const rounded = Math.round(scaled * factor) / factor;
  let numStr = rounded.toFixed(precision).replace(/(\.\.d*?)(0+)$/, '$1').replace(/\.$/, '');

  const rawBytesPerSecond = bitsPerSecond / 8;
  const bytesPerSecond = formatString(rawBytesPerSecond, { precision }) + '/s';

  return {
    formatted: `${numStr} ${selected.symbol}`,
    bytesPerSecond,
    bitsPerSecond,
    rawBytesPerSecond,
  };
}

/**
 * Parse a speed string like "100 Mbps" or "1 Gbps" to bits per second.
 * @param input - Speed string to parse
 * @returns Bits per second
 */
export function parseSpeed(input: string): number {
  const trimmed = input.trim();
  const match = trimmed.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(bps|kbps|mbps|gbps|tbps)$/i);
  if (!match) {
    throw new Error(`Invalid speed format: "${input}". Expected format like "100 Mbps"`);
  }
  const num = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  const entry = BIT_UNITS.find(u => u.symbol.toLowerCase() === unit);
  if (!entry) throw new Error(`Unknown speed unit: "${match[2]}"`);
  return num * entry.factor;
}
