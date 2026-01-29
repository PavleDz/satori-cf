# satori-cf

[![npm version](https://img.shields.io/npm/v/satori-cf.svg)](https://www.npmjs.com/package/satori-cf)
[![npm downloads](https://img.shields.io/npm/dm/satori-cf.svg)](https://www.npmjs.com/package/satori-cf)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Lightweight, SVG-only Open Graph image generation for Cloudflare Workers

Generate dynamic OG images at the edge with minimal overhead. Built on [Satori](https://github.com/vercel/satori), optimized for Cloudflare Workers.

## Features

- **Tiny footprint** - ~90KB WASM (Yoga only), no resvg (~1.3MB saved)
- **SVG output** - Clean, scalable vectors that work everywhere
- **Batch processing** - Generate multiple images with single WASM init
- **Streaming API** - Handle large batches without memory issues
- **Google Fonts** - Load any font with built-in Cloudflare caching
- **Emoji support** - Twemoji, OpenMoji, Noto, and more
- **TypeScript** - Full type safety with Result pattern error handling

## Installation

```bash
npm install satori-cf

```

## Quick Start

```typescript
import { generateOG, createSVGResponse } from "satori-cf";

export default {
  async fetch(request: Request): Promise<Response> {
    const result = await generateOG(
      `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 60px;">
        Hello World
      </div>`,
    );

    if (result.ok) {
      return createSVGResponse(result.value);
    }

    return new Response(result.error.message, { status: 500 });
  },
};
```

## Usage

### HTML String

```typescript
const result = await generateOG(`
  <div style="display: flex; flex-direction: column; padding: 40px; background: #1a1a2e; color: white; width: 100%; height: 100%;">
    <h1 style="font-size: 48px; margin: 0;">My Blog Post</h1>
    <p style="font-size: 24px; color: #888;">Published on January 29, 2026</p>
  </div>
`);
```

### React/JSX Element

```typescript
import { generateOG } from "satori-cf";

const element = (
  <div style={{ display: "flex", background: "#000", color: "#fff", width: "100%", height: "100%" }}>
    <h1>Hello from JSX</h1>
  </div>
);

const result = await generateOG(element);
```

### With Custom Fonts

```typescript
import { generateOG, loadGoogleFont } from "satori-cf";

const fontData = await loadGoogleFont({
  family: "Inter",
  weight: 600,
});

const result = await generateOG(element, {
  fonts: [
    {
      name: "Inter",
      data: fontData,
      weight: 600,
      style: "normal",
    },
  ],
});
```

### With Emojis

```typescript
const result = await generateOG(
  `<div style="display: flex; font-size: 64px;">Hello 👋 World 🌍</div>`,
  { emoji: "twemoji" },
);
```

Supported emoji sets: `twemoji`, `openmoji`, `blobmoji`, `noto`, `fluent`, `fluentFlat`

### Batch Generation

Generate multiple images efficiently with shared WASM initialization:

```typescript
import { generateOGBatch } from "satori-cf";

const items = [
  { element: '<div style="color: red;">Image 1</div>' },
  { element: '<div style="color: blue;">Image 2</div>' },
  { element: '<div style="color: green;">Image 3</div>' },
];

const results = await generateOGBatch(items, {
  concurrency: 5,
  failFast: false,
});

for (const { index, result } of results) {
  if (result.ok) {
    console.log(`Image ${index}: ${result.value.length} bytes`);
  } else {
    console.error(`Image ${index} failed:`, result.error);
  }
}
```

### Streaming Large Batches

For memory-efficient processing of large batches:

```typescript
import { OGStream } from "satori-cf";

const items = generateManyItems(); // Could be hundreds of items

for await (const { index, result } of OGStream(items, { prefetch: 3 })) {
  if (result.ok) {
    await saveToR2(result.value); // Save as you go
  }
}
```

## API Reference

### `generateOG(element, options?)`

Generate a single SVG image.

| Parameter | Type                  | Description                  |
| --------- | --------------------- | ---------------------------- |
| `element` | `string \| ReactNode` | HTML string or React element |
| `options` | `OGOptions`           | Optional configuration       |

Returns: `Promise<OGResult<string>>`

### `generateOGBatch(items, options?)`

Generate multiple images with amortized initialization.

| Parameter | Type           | Description                      |
| --------- | -------------- | -------------------------------- |
| `items`   | `BatchItem[]`  | Array of `{ element, options? }` |
| `options` | `BatchOptions` | Batch configuration              |

Returns: `Promise<BatchResult[]>`

### `OGStream(items, options?)`

AsyncGenerator for streaming large batches.

| Parameter | Type                  | Description          |
| --------- | --------------------- | -------------------- |
| `items`   | `Iterable<BatchItem>` | Items to process     |
| `options` | `StreamOptions`       | Stream configuration |

Returns: `AsyncGenerator<BatchResult>`

### `loadGoogleFont(options)`

Load a font from Google Fonts with caching.

```typescript
const fontData = await loadGoogleFont({
  family: "Roboto", // Font family name
  weight: 400, // Font weight (optional)
  text: "Hello", // Subset to specific characters (optional)
});
```

Returns: `Promise<ArrayBuffer>`

### `createSVGResponse(svg, options?)`

Create an HTTP Response with proper SVG headers.

```typescript
return createSVGResponse(svg, {
  status: 200,
  headers: { "X-Custom": "header" },
  debug: false, // Set true to disable caching
});
```

## Options

### OGOptions

| Option   | Type        | Default     | Description              |
| -------- | ----------- | ----------- | ------------------------ |
| `width`  | `number`    | `1200`      | Image width in pixels    |
| `height` | `number`    | `630`       | Image height in pixels   |
| `fonts`  | `Font[]`    | Auto-loaded | Custom fonts array       |
| `emoji`  | `EmojiType` | -           | Emoji provider           |
| `debug`  | `boolean`   | `false`     | Disable response caching |

### BatchOptions

Extends `OGOptions`:

| Option        | Type      | Default | Description              |
| ------------- | --------- | ------- | ------------------------ |
| `concurrency` | `number`  | `5`     | Max parallel generations |
| `failFast`    | `boolean` | `false` | Stop on first error      |

### StreamOptions

Extends `OGOptions`:

| Option     | Type     | Default | Description             |
| ---------- | -------- | ------- | ----------------------- |
| `prefetch` | `number` | `3`     | Items to prefetch ahead |

## Result Pattern

All generators return a discriminated union for type-safe error handling:

```typescript
type OGResult<T> = { ok: true; value: T } | { ok: false; error: Error };

const result = await generateOG(element);

if (result.ok) {
  // result.value is the SVG string
  return createSVGResponse(result.value);
} else {
  // result.error is the Error object
  console.error(result.error.message);
  return new Response("Failed", { status: 500 });
}
```

## Performance

Benchmarks on Cloudflare Workers (cold start):

| Operation               | Time                       |
| ----------------------- | -------------------------- |
| First image (WASM init) | ~270ms                     |
| Subsequent images       | ~90ms                      |
| Batch of 10 images      | ~280ms total (~28ms/image) |

## Comparison

| Feature   | satori-cf  | workers-og | @vercel/og  |
| --------- | ---------- | ---------- | ----------- |
| Output    | SVG        | PNG + SVG  | PNG         |
| WASM size | ~90KB      | ~1.4MB     | ~1.4MB      |
| Platform  | CF Workers | CF Workers | Vercel Edge |
| Batch API | Yes        | No         | No          |
| Streaming | Yes        | No         | No          |

## Credits

Built on the shoulders of giants:

- [Satori](https://github.com/vercel/satori) by Vercel - SVG generation engine
- [workers-og](https://github.com/kvnang/workers-og) by Kevin Ang - CF Workers patterns
- [@vercel/og](https://vercel.com/docs/functions/og-image-generation) - API inspiration

## License

MIT © [Pavle Dzuverovic](https://github.com/PavleDz)
