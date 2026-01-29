import {
  generateOG,
  generateOGBatch,
  OGStream,
  createSVGResponse,
  loadGoogleFont,
  isInitialized,
} from "satori-cf";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Test 1: Single image generation with HTML string
      if (path === "/single" || path === "/") {
        const title = url.searchParams.get("title") || "Hello World";
        const start = performance.now();

        const result = await generateOG(
          `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 60px; font-weight: bold;">
            <div style="display: flex;">${title}</div>
            <div style="display: flex; font-size: 24px; margin-top: 20px; opacity: 0.8;">Generated with satori-cf</div>
          </div>`
        );

        const elapsed = performance.now() - start;

        if (result.ok) {
          console.log(`Single generation took ${elapsed.toFixed(2)}ms`);
          return createSVGResponse(result.value, { debug: true });
        }

        return new Response(`Error: ${result.error.message}`, { status: 500 });
      }

      // Test 2: Batch generation (amortization test)
      if (path === "/batch") {
        const count = parseInt(url.searchParams.get("count") || "5");
        const start = performance.now();

        const items = Array.from({ length: count }, (_, i) => ({
          element: `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: hsl(${(i * 60) % 360}, 70%, 60%); color: white; font-size: 48px;">
            Image ${i + 1} of ${count}
          </div>`,
        }));

        const results = await generateOGBatch(items, { concurrency: 3 });

        const elapsed = performance.now() - start;
        const successful = results.filter((r) => r.result.ok).length;
        const failed = results.filter((r) => !r.result.ok).length;

        console.log(
          `Batch of ${count} took ${elapsed.toFixed(2)}ms (${(elapsed / count).toFixed(2)}ms per image)`
        );

        return new Response(
          JSON.stringify(
            {
              count,
              successful,
              failed,
              totalMs: elapsed.toFixed(2),
              perImageMs: (elapsed / count).toFixed(2),
              wasmInitialized: isInitialized(),
              results: results.map((r) => ({
                index: r.index,
                ok: r.result.ok,
                length: r.result.ok ? r.result.value.length : 0,
                error: r.result.ok ? null : r.result.error.message,
              })),
            },
            null,
            2
          ),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Test 3: Stream generation
      if (path === "/stream") {
        const count = parseInt(url.searchParams.get("count") || "10");
        const start = performance.now();

        const items = Array.from({ length: count }, (_, i) => ({
          element: `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #333; color: white; font-size: 36px;">
            Stream item ${i + 1}
          </div>`,
        }));

        const streamResults: Array<{
          index: number;
          ok: boolean;
          length: number;
        }> = [];

        for await (const { index, result } of OGStream(items, { prefetch: 3 })) {
          streamResults.push({
            index,
            ok: result.ok,
            length: result.ok ? result.value.length : 0,
          });
        }

        const elapsed = performance.now() - start;

        return new Response(
          JSON.stringify(
            {
              count,
              totalMs: elapsed.toFixed(2),
              perImageMs: (elapsed / count).toFixed(2),
              results: streamResults,
            },
            null,
            2
          ),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Test 4: Custom font
      if (path === "/custom-font") {
        const start = performance.now();

        const fontData = await loadGoogleFont({
          family: "Roboto",
          weight: 700,
        });

        const result = await generateOG(
          `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #1a1a2e; color: #edf2f4; font-size: 72px;">
            Custom Roboto Font
          </div>`,
          {
            fonts: [
              {
                name: "Roboto",
                data: fontData,
                weight: 700,
                style: "normal",
              },
            ],
          }
        );

        const elapsed = performance.now() - start;

        if (result.ok) {
          console.log(`Custom font generation took ${elapsed.toFixed(2)}ms`);
          return createSVGResponse(result.value, { debug: true });
        }

        return new Response(`Error: ${result.error.message}`, { status: 500 });
      }

      // Test 5: With emoji
      if (path === "/emoji") {
        const result = await generateOG(
          `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #ffeaa7; font-size: 64px;">
            Hello 👋 World 🌍
          </div>`,
          { emoji: "twemoji" }
        );

        if (result.ok) {
          return createSVGResponse(result.value, { debug: true });
        }

        return new Response(`Error: ${result.error.message}`, { status: 500 });
      }

      // Test 6: Amortization verification
      if (path === "/amortization-test") {
        // First call - includes WASM init
        const start1 = performance.now();
        await generateOG('<div style="display: flex;">First</div>');
        const firstTime = performance.now() - start1;

        // Second call - no WASM init needed
        const start2 = performance.now();
        await generateOG('<div style="display: flex;">Second</div>');
        const secondTime = performance.now() - start2;

        // Batch call - should be efficient
        const start3 = performance.now();
        await generateOGBatch(
          Array.from({ length: 5 }, (_, i) => ({
            element: `<div style="display: flex;">Batch ${i}</div>`,
          }))
        );
        const batchTime = performance.now() - start3;

        return new Response(
          JSON.stringify(
            {
              firstCallMs: firstTime.toFixed(2),
              secondCallMs: secondTime.toFixed(2),
              batchOf5Ms: batchTime.toFixed(2),
              batchPerImageMs: (batchTime / 5).toFixed(2),
              amortizationWorking: secondTime < firstTime * 0.5,
              note: "Second call should be much faster than first (no WASM init)",
            },
            null,
            2
          ),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Help page
      return new Response(
        `satori-cf Example Worker

Available endpoints:
  /single?title=Hello    - Generate single SVG image
  /batch?count=5         - Batch generate images (JSON response)
  /stream?count=10       - Stream generate images (JSON response)
  /custom-font           - Generate with custom Google Font
  /emoji                 - Generate with emoji support
  /amortization-test     - Verify WASM init amortization

Examples:
  curl http://localhost:8787/single?title=Test
  curl http://localhost:8787/batch?count=10
  curl http://localhost:8787/amortization-test
`,
        {
          headers: { "Content-Type": "text/plain" },
        }
      );
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        `Internal error: ${error instanceof Error ? error.message : String(error)}`,
        { status: 500 }
      );
    }
  },
};
