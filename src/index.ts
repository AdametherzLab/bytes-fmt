import type {
  UnitSystem,
  UnitEntry,
  FormatOptions,
  ParseResult,
  FormatResult,
  TransferTimeResult,
  StorageItem,
  StorageCompareResult,
  BitRateResult,
} from './types';

import { formatBytes, formatString } from './format';

import { UNIT_TABLE, getUnitEntry, roundTo, parseBytes } from './utils';

import { transferTime, storageCompare, formatBitRate, parseSpeed, SPEED_PRESETS, SIZE_PRESETS } from './extras';

export type {
  UnitSystem,
  UnitEntry,
  FormatOptions,
  ParseResult,
  FormatResult,
  TransferTimeResult,
  StorageItem,
  StorageCompareResult,
  BitRateResult,
};

export { formatBytes, formatString };

export { UNIT_TABLE, getUnitEntry, roundTo, parseBytes };

export { transferTime, storageCompare, formatBitRate, parseSpeed, SPEED_PRESETS, SIZE_PRESETS };
