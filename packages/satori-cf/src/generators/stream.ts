import satori from "satori/wasm";
import { ensureYogaInitialized } from "../core/yoga";
import { parseHtml } from "../html/parser";
import { loadGoogleFont } from "../assets/font";
import { loadDynamicAsset } from "../assets/emoji";
import { SVGGenerationError } from "../errors";
import type { StreamItem, StreamOptions, StreamResult } from "../types";
import type { Font } from "satori";

/**
 * Generates OG images as an async generator for streaming large batches.
 * Uses a prefetch pipeline for optimal throughput while maintaining
 * memory efficiency.
 *
 * @param items - Iterable or AsyncIterable of items to generate
 * @param options - Stream generation options
 * @yields Results in order as they complete
 *
 * @example
 * ```ts
 * for await (const { index, result } of OGStream(items, { prefetch: 3 })) {
 *   if (result.ok) {
 *     console.log(`Generated ${index}: ${result.value.length} bytes`);
 *   }
 * }
 * ```
 */
export async function* OGStream(
  items: Iterable<StreamItem> | AsyncIterable<StreamItem>,
  options: StreamOptions = {}
): AsyncGenerator<StreamResult, void, unknown> {
  const { prefetch = 3, ...defaultOptions } = options;

  // 1. Single WASM initialization before streaming
  await ensureYogaInitialized();

  // 2. Pre-load default fonts once
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

  // Helper to generate a single item
  async function generateItem(
    item: StreamItem,
    index: number
  ): Promise<StreamResult> {
    try {
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

      const width = item.options?.width ?? defaultWidth;
      const height = item.options?.height ?? defaultHeight;
      const fonts = item.options?.fonts?.length ? item.options.fonts : defaultFonts;
      const emoji = item.options?.emoji ?? defaultOptions.emoji;

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
        err instanceof Error ? err : new SVGGenerationError(String(err));
      return { index, result: { ok: false, error } };
    }
  }

  // 3. Prefetch pipeline
  const pending: Promise<StreamResult>[] = [];
  let index = 0;

  // Convert to async iterator
  const iterator = Symbol.asyncIterator in items
    ? (items as AsyncIterable<StreamItem>)[Symbol.asyncIterator]()
    : (items as Iterable<StreamItem>)[Symbol.iterator]();

  // Fill initial prefetch buffer
  for (let i = 0; i < prefetch; i++) {
    const next = await (iterator as AsyncIterator<StreamItem>).next();
    if (next.done) break;
    pending.push(generateItem(next.value, index++));
  }

  // Process with sliding window
  while (pending.length > 0) {
    // Wait for the first item in the queue (maintains order)
    const result = await pending.shift()!;
    yield result;

    // Refill the prefetch buffer
    const next = await (iterator as AsyncIterator<StreamItem>).next();
    if (!next.done) {
      pending.push(generateItem(next.value, index++));
    }
  }
}
