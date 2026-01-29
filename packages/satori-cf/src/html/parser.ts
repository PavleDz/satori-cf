import {
  getAttributes,
  maybeRemoveTrailingComma,
  sanitizeJSON,
} from "./utils";

/**
 * Parses HTML into a ReactElementLike object
 * using Cloudflare Worker's own HTMLRewriter.
 *
 * This approach leverages the HTMLRewriter API which is part of
 * Cloudflare Worker's runtime, making it the fastest way to
 * transform HTML in this environment.
 *
 * @param html - HTML string to parse
 * @returns Promise resolving to a React-like node or null on error
 */
export async function parseHtml(html: string): Promise<React.ReactNode | null> {
  let vdomStr = ``;

  const rewriter = new HTMLRewriter()
    .on("*", {
      element(element: Element) {
        const attrs = getAttributes(element);
        vdomStr += `{"type":"${element.tagName}", "props":{${attrs}"children": [`;
        try {
          element.onEndTag(() => {
            vdomStr = maybeRemoveTrailingComma(vdomStr);
            vdomStr += `]}},`;
          });
        } catch (e) {
          vdomStr = maybeRemoveTrailingComma(vdomStr);
          vdomStr += `]}},`;
        }
      },
      text(text: Text) {
        if (text.text) {
          const sanitized = sanitizeJSON(text.text);
          if (sanitized) {
            vdomStr += `"${sanitized}",`;
          }
        }
      },
    })
    .transform(
      new Response(
        // Add a parent to ensure that we're only dealing
        // with a single root element
        `<div style="display: flex; flex-direction: column;">${html}</div>`
      )
    );

  await rewriter.text();

  vdomStr = maybeRemoveTrailingComma(vdomStr);

  try {
    return JSON.parse(vdomStr);
  } catch (e) {
    console.error(e);
    return null;
  }
}
