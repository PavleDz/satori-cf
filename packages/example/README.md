# satori-cf Example Worker

An example Cloudflare Worker demonstrating satori-cf usage.

## Setup

```bash
# From the repo root
pnpm install
pnpm --filter satori-cf build
```

## Development

```bash
pnpm dev
```

Then visit:
- http://localhost:8787/ - Single image with default title
- http://localhost:8787/single?title=Hello - Single image with custom title
- http://localhost:8787/batch?count=10 - Batch generation benchmark
- http://localhost:8787/stream?count=10 - Stream generation benchmark
- http://localhost:8787/custom-font - Custom Google Font example
- http://localhost:8787/emoji - Emoji rendering example
- http://localhost:8787/amortization-test - WASM amortization verification

## Deploy

```bash
pnpm deploy
```
