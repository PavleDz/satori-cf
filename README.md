# satori-cf

> SVG-only, batch-optimized Open Graph image generation for Cloudflare Workers

A lightweight library for generating OG images as SVG on Cloudflare Workers. Built on [Satori](https://github.com/vercel/satori) with inspiration from [`@vercel/og`](https://vercel.com/docs/functions/og-image-generation) and [`workers-og`](https://github.com/kvnang/workers-og).

## Key Features

- **SVG-only** - No resvg WASM (saves ~1.3MB), outputs clean SVG
- **Batch-optimized** - Single WASM initialization for N images
- **Streaming** - AsyncGenerator pattern for large batches without OOM
- **Modern TypeScript** - Strict types, Result pattern for error handling
- **Lightweight** - ~90KB WASM (Yoga only) vs ~1.4MB (Yoga + resvg)

## Differences from `workers-og`

| Feature        | workers-og | satori-cf |
| -------------- | ---------- | --------- |
| Output formats | PNG + SVG  | SVG only  |
| WASM size      | ~1.4MB     | ~90KB     |
| Batch API      | No         | Yes       |
| Streaming API  | No         | Yes       |
| Result pattern | No         | Yes       |

## Installation

```bash
npm install satori-cf
# or
pnpm add satori-cf
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

## API

### `generateOG(element, options?)`

Generate a single OG image as SVG.

```typescript
import { generateOG } from "satori-cf";

// With HTML string
const result = await generateOG('<div style="color: red">Hello</div>');

// With React element
const result = await generateOG(<Card title="Hello" />);

// With options
const result = await generateOG(element, {
  width: 1200,
  height: 630,
  fonts: [{ name: "Inter", data: fontData, weight: 600, style: "normal" }],
  emoji: "twemoji",
});

if (result.ok) {
  console.log(result.value); // SVG string
} else {
  console.error(result.error);
}
```

### `generateOGBatch(items, options?)`

Generate multiple images with amortized WASM initialization.

```typescript
import { generateOGBatch } from "satori-cf";

const results = await generateOGBatch(
  [
    { element: '<div style="color: red">One</div>' },
    { element: '<div style="color: blue">Two</div>' },
    { element: '<div style="color: green">Three</div>' },
  ],
  { concurrency: 5 },
);

for (const { index, result } of results) {
  if (result.ok) {
    console.log(`Image ${index}: ${result.value.length} bytes`);
  }
}
```

### `OGStream(items, options?)`

Stream large batches without memory issues.

```typescript
import { OGStream } from "satori-cf";

for await (const { index, result } of OGStream(items, { prefetch: 3 })) {
  if (result.ok) {
    await saveToStorage(result.value);
  }
}
```

### `loadGoogleFont(options)`

Load fonts from Google Fonts with Cloudflare caching.

```typescript
import { loadGoogleFont, generateOG } from "satori-cf";

const fontData = await loadGoogleFont({
  family: "Inter",
  weight: 600,
});

const result = await generateOG(element, {
  fonts: [{ name: "Inter", data: fontData, weight: 600, style: "normal" }],
});
```

### `createSVGResponse(svg, options?)`

Create a Response with proper SVG headers.

```typescript
import { createSVGResponse } from "satori-cf";

return createSVGResponse(svg, {
  headers: { "X-Custom": "header" },
  status: 200,
  debug: false, // Set true to disable caching
});
```

## Options

### `OGOptions`

| Option   | Type        | Default     | Description                                  |
| -------- | ----------- | ----------- | -------------------------------------------- |
| `width`  | `number`    | `1200`      | Image width in pixels                        |
| `height` | `number`    | `630`       | Image height in pixels                       |
| `fonts`  | `Font[]`    | Auto-loaded | Array of font objects                        |
| `emoji`  | `EmojiType` | -           | Emoji provider (`twemoji`, `openmoji`, etc.) |
| `debug`  | `boolean`   | `false`     | Disable caching                              |

### `BatchOptions`

Extends `OGOptions` with:

| Option        | Type      | Default | Description                |
| ------------- | --------- | ------- | -------------------------- |
| `concurrency` | `number`  | `5`     | Max concurrent generations |
| `failFast`    | `boolean` | `false` | Stop on first error        |

### `StreamOptions`

Extends `OGOptions` with:

| Option     | Type     | Default | Description             |
| ---------- | -------- | ------- | ----------------------- |
| `prefetch` | `number` | `3`     | Items to prefetch ahead |

## Performance

Benchmarks on Cloudflare Workers (cold start):

| Operation                    | Time                       |
| ---------------------------- | -------------------------- |
| First image (with WASM init) | ~270ms                     |
| Subsequent images            | ~90ms                      |
| Batch of 10 images           | ~280ms total (~28ms/image) |

## Credits

This library builds upon the excellent work of:

- [workers-og](https://github.com/kvnang/workers-og) by Kevin Ang - Cloudflare Workers adaptation, HTML parsing via HTMLRewriter, font/emoji loading patterns
- [Satori](https://github.com/vercel/satori) by Vercel - The core SVG generation engine
- [@vercel/og](https://vercel.com/docs/functions/og-image-generation) by Vercel - API inspiration

## License

MIT
