import type { SVGResponseOptions } from "../types";

/**
 * Creates a Response object with appropriate headers for SVG content.
 *
 * @param svg - The SVG string to return
 * @param options - Response options
 * @returns A Response object with the SVG content
 *
 * @example
 * ```ts
 * const result = await generateOG(element);
 * if (result.ok) {
 *   return createSVGResponse(result.value);
 * }
 * ```
 */
export function createSVGResponse(
  svg: string,
  options: SVGResponseOptions = {}
): Response {
  const { headers = {}, status = 200, statusText, debug = false } = options;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": debug
        ? "no-cache, no-store"
        : "public, immutable, no-transform, max-age=31536000",
      ...headers,
    },
    status,
    statusText,
  });
}
