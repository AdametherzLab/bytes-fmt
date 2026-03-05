[![CI](https://github.com/AdametherzLab/bytes-fmt/actions/workflows/ci.yml/badge.svg)](https://github.com/AdametherzLab/bytes-fmt/actions) [![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

# bytes-fmt 🧠

TypeScript byte size formatter that makes handling file sizes painless. Convert bytes to human-readable strings (KB, MB, GB, TB) and parse them back. Supports both SI (decimal) and IEC (binary) units out of the box.

## Features

- **Bidirectional conversion** — format bytes to readable strings and parse them back to bytes
- **Dual unit systems** — SI (1000-based) and IEC (1024-based) standards supported
- **TypeScript-first** — full type safety with strict mode enabled
- **Zero dependencies** — lightweight package with no external baggage
- **Flexible formatting** — customize precision, separators, and unit display

## Installation

```bash
npm install @adametherzlab/bytes-fmt
# or
bun add @adametherzlab/bytes-fmt
```

## Quick Start

```typescript
// REMOVED external import: import { formatBytes, formatString, parseBytes } from '@adametherzlab/bytes-fmt';

// Format bytes to a readable string
const result = formatBytes(1500);
console.log(result.formatted); // "1.5 KB"

// Get just the string with custom options
const str = formatString(1024 * 1024, { precision: 2, unitSystem: 'iec' });
console.log(str); // "1.00 MiB"

// Parse a human-readable string back to bytes
const parsed = parseBytes('2.5 GB');
console.log(parsed.value); // 2500000000
```

## Unit Systems Explained

### SI (International System) — Base 1000

| Unit   | Symbol | Bytes       | Exponent |
|--------|--------|-------------|----------|
| Byte   | B      | 1           | 0        |
| Kilobyte | KB   | 1,000       | 1        |
| Megabyte | MB   | 1,000,000   | 2        |
| Gigabyte | GB   | 1,000,000,000 | 3      |
| Terabyte | TB   | 10¹²        | 4        |

### IEC (International Electrotechnical Commission) — Base 1024

| Unit   | Symbol | Bytes       | Exponent |
|--------|--------|-------------|----------|
| Byte   | B      | 1           | 0        |
| Kibibyte | KiB  | 1,024       | 1        |
| Mebibyte | MiB  | 1,048,576   | 2        |
| Gibibyte | GiB  | 1,073,741,824 | 3      |
| Tebibyte | TiB  | 2⁴⁰         | 4        |

**Pro tip:** Use SI for displaying storage capacity to users, use IEC for memory/disk usage in technical contexts.

## API Reference

### formatBytes(bytes: number, options?: FormatOptions): FormatResult

```typescript
const result = formatBytes(1500);
// { formatted: "1.5 KB", bytes: 1500, unit: "KB", unitSystem: "si" }

const iecResult = formatBytes(2048, { unitSystem: 'iec' });
// { formatted: "2 KiB", bytes: 2048, unit: "KiB", unitSystem: "iec" }
```

### formatString(bytes: number, options?: FormatOptions): string

```typescript
const str = formatString(1024 * 1024);
// "1 MB"

const precise = formatString(1536, { precision: 2, unitSystem: 'si' });
// "1.54 KB"
```

### parseBytes(input: string): ParseResult

```typescript
const parsed = parseBytes('1.5 MB');
// { value: 1500000, unit: "MB" }

const binary = parseBytes('2GiB');
// { value: 2147483648, unit: "GiB" }
```

### UNIT_TABLE: readonly UnitEntry[]

```typescript
// REMOVED external import: import { UNIT_TABLE } from '@adametherzlab/bytes-fmt';

console.log(UNIT_TABLE);
// [
//   { symbol: "B", base: 1000, exponent: 0 },
//   { symbol: "KB", base: 1000, exponent: 1 },
//   ...
//   { symbol: "KiB", base: 1024, exponent: 1 },
//   ...
// ]
```

### getUnitEntry(symbol: string, system?: UnitSystem): UnitEntry | undefined

```typescript
const entry = getUnitEntry('MB', 'si');
// { symbol: "MB", base: 1000, exponent: 1 }

const iecEntry = getUnitEntry('MB', 'iec');
// undefined (MB doesn't exist in IEC, use MiB)

const anyEntry = getUnitEntry('GiB');
// { symbol: "GiB", base: 1024, exponent: 3 }
```

### roundTo(value: number, decimals: number = 1): number

```typescript
const rounded = roundTo(3.14159, 2);
// 3.14

const oneDecimal = roundTo(1.23456);
// 1.2
```

## FormatOptions Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `precision` | `number` | `1` | Number of decimal places (0-15) |
| `unitSystem` | `'si' \| 'iec'` | `'si'` | Unit system to use |
| `separator` | `string` | `' '` | String between number and unit |

## Advanced Usage

```typescript
// REMOVED external import: import { formatBytes, formatString, parseBytes, getUnitEntry, UNIT_TABLE } from '@adametherzlab/bytes-fmt';

// Custom formatting for file sizes with IEC units
const fileSize = formatBytes(1024 * 1024 * 500, { 
  precision: 2, 
  unitSystem: 'iec' 
});
console.log(fileSize.formatted); // "500.00 MiB"

// Parse user input and validate
function processUserInput(input: string): number {
  try {
    const parsed = parseBytes(input);
    return parsed.value;
  } catch (e) {
    console.error('Invalid byte string:', input);
    return 0;
  }
}

// Find all SI units for a dropdown
const siUnits = UNIT_TABLE.filter(u => u.base === 1000);
console.log(siUnits.map(u => u.symbol)); // ["B", "KB", "MB", "GB", "TB"]

// Batch format multiple values
const sizes = [500, 1024, 1500, 1024 * 1024];
const formatted = sizes.map(s => formatString(s, { unitSystem: 'iec' }));
console.log(formatted); // ["500 B", "1 KiB", "1.46 KiB", "1 MiB"]
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT (c) [AdametherzLab](https://github.com/AdametherzLab)