import satori from "satori/wasm";
import { ensureYogaInitialized } from "../core/yoga";
import { parseHtml } from "../html/parser";
import { loadGoogleFont } from "../assets/font";
import { loadDynamicAsset } from "../assets/emoji";
import { SVGGenerationError } from "../errors";
import type { OGOptions, OGResult } from "../types";

/**
 * Generates a single OG image as SVG.
 *
 * @param element - React element or HTML string to render
 * @param options - Generation options
 * @returns Result containing the SVG string or an error
 *
 * @example
 * ```ts
 * const result = await generateOG(<Card title="Hello" />);
 * if (result.ok) {
 *   console.log(result.value); // "<svg..."
 * }
 * ```
 *
 * @example
 * ```ts
 * const result = await generateOG('<div style="color: red">Hello</div>');
 * ```
 */
export async function generateOG(
  element: React.ReactNode | string,
  options: OGOptions = {}
): Promise<OGResult<string>> {
  try {
    // 1. Ensure WASM is initialized
    await ensureYogaInitialized();

    // 2. Parse HTML if string input
    const reactElement =
      typeof element === "string" ? await parseHtml(element) : element;

    if (reactElement === null) {
      return {
        ok: false,
        error: new SVGGenerationError("Failed to parse HTML element"),
      };
    }

    // 3. Prepare dimensions
    const width = options.width ?? 1200;
    const height = options.height ?? 630;

    // 4. Load fonts if not provided
    const fonts = options.fonts?.length
      ? options.fonts
      : [
          {
            name: "Bitter",
            data: await loadGoogleFont({ family: "Bitter", weight: 600 }),
            weight: 500 as const,
            style: "normal" as const,
          },
        ];

    // 5. Generate SVG with Satori
    const svg = await satori(reactElement, {
      width,
      height,
      fonts,
      loadAdditionalAsset: options.emoji
        ? loadDynamicAsset({ emoji: options.emoji })
        : undefined,
    });

    return { ok: true, value: svg };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err
          : new SVGGenerationError(String(err)),
    };
  }
}
