import type { GoogleFontOptions } from "../types";
import { FontLoadError } from "../errors";

/**
 * Loads a font from Google Fonts API.
 * Uses Cloudflare's cache API for efficient caching.
 *
 * @param options - Font loading options
 * @returns ArrayBuffer containing the font data
 */
export async function loadGoogleFont({
  family,
  weight,
  text,
}: GoogleFontOptions): Promise<ArrayBuffer> {
  const params: Record<string, string> = {
    family: `${encodeURIComponent(family)}${weight ? `:wght@${weight}` : ""}`,
  };

  if (text) {
    params.text = text;
  } else {
    params.subset = "latin";
  }

  const url = `https://fonts.googleapis.com/css2?${Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join("&")}`;

  const cache = caches.default;
  const cacheKey = url;
  let res = await cache.match(cacheKey);

  if (!res) {
    res = await fetch(`${url}`, {
      headers: {
        // construct user agent to get TTF font
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    });

    res = new Response(res.body, res);
    res.headers.append("Cache-Control", "s-maxage=3600");

    await cache.put(cacheKey, res.clone());
  }

  const body = await res.text();
  // Get the font URL from the CSS text
  const fontUrl = body.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/
  )?.[1];

  if (!fontUrl) {
    throw new FontLoadError(`Could not find font URL for ${family}`);
  }

  return fetch(fontUrl).then((res) => res.arrayBuffer());
}
