# satori-cf

> SVG-only, batch-optimized Open Graph image generation for Cloudflare Workers

See the [main README](../../README.md) for full documentation.

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
      `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #667eea; color: white; font-size: 60px;">
        Hello World
      </div>`
    );

    if (result.ok) {
      return createSVGResponse(result.value);
    }

    return new Response(result.error.message, { status: 500 });
  },
};
```

## License

MIT
