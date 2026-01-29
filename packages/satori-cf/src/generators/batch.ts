import satori from "satori/wasm";
import { ensureYogaInitialized } from "../core/yoga";
import { parseHtml } from "../html/parser";
import { loadGoogleFont } from "../assets/font";
import { loadDynamicAsset } from "../assets/emoji";
import { SVGGenerationError } from "../errors";
import type { BatchItem, BatchOptions, BatchResult } from "../types";
import type { Font } from "satori";

/**
 * Generates multiple OG images as SVG with amortized WASM initialization.
 * The WASM module is initialized once at the start, and fonts are pre-loaded
 * for the entire batch.
 *
 * @param items - Array of items to generate
 * @param options - Batch generation options
 * @returns Array of results with preserved indices
 *
 * @example
 * ```ts
 * const results = await generateOGBatch([
 *   { element: <Card title="One" /> },
 *   { element: <Card title="Two" /> },
 * ], { concurrency: 5 });
 *
 * for (const { index, result } of results) {
 *   if (result.ok) {
 *     console.log(`Item ${index}: ${result.value.length} bytes`);
 *   }
 * }
 * ```
 */
export async function generateOGBatch(
  items: BatchItem[],
  options: BatchOptions = {}
): Promise<BatchResult[]> {
  const { concurrency = 5, failFast = false, ...defaultOptions } = options;

  // 1. Single WASM initialization for the entire batch (amortization)
  await ensureYogaInitialized();

  // 2. Pre-load default fonts once for the batch
  const defaultFonts: Font[] = defaultOptions.fonts?.length
    ? defaultOptions.fonts
    : [
        {
          name: "Bitter",
          data: await loadGoogleFont({ family: "Bitter", weight: 600 }),
          weight: 500 as const,
          style: "normal" as const,
        },
      ];

  const defaultWidth = defaultOptions.width ?? 1200;
  const defaultHeight = defaultOptions.height ?? 630;

  // 3. Process items in chunks based on concurrency
  const results: BatchResult[] = [];
  let stopped = false;

  for (let i = 0; i < items.length && !stopped; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkPromises = chunk.map(async (item, chunkIndex): Promise<BatchResult> => {
      const index = i + chunkIndex;

      try {
        // Parse HTML if string input
        const reactElement =
          typeof item.element === "string"
            ? await parseHtml(item.element)
            : item.element;

        if (reactElement === null) {
          return {
            index,
            result: {
              ok: false,
              error: new SVGGenerationError("Failed to parse HTML element"),
            },
          };
        }

        // Merge options
        const width = item.options?.width ?? defaultWidth;
        const height = item.options?.height ?? defaultHeight;
        const fonts = item.options?.fonts?.length ? item.options.fonts : defaultFonts;
        const emoji = item.options?.emoji ?? defaultOptions.emoji;

        // Generate SVG
        const svg = await satori(reactElement, {
          width,
          height,
          fonts,
          loadAdditionalAsset: emoji
            ? loadDynamicAsset({ emoji })
            : undefined,
        });

        return { index, result: { ok: true, value: svg } };
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new SVGGenerationError(String(err));
        return { index, result: { ok: false, error } };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);

    // Check for failFast
    if (failFast) {
      const hasError = chunkResults.some((r) => !r.result.ok);
      if (hasError) {
        stopped = true;
      }
    }
  }

  // Sort by index to maintain order
  results.sort((a, b) => a.index - b.index);

  return results;
}
