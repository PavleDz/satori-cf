import camelCase from "just-camel-case";

/**
 * Sanitizes a string for use in JSON
 */
export const sanitizeJSON = (unsanitized: string): string => {
  return unsanitized
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\f/g, "\\f")
    .replace(/"/g, '\\"');
};

/**
 * Extracts and formats attributes from an HTML element for JSON VDOM
 */
export const getAttributes = (element: Element): string => {
  let attrs = "";

  const style = element.getAttribute("style");

  if (style) {
    const cleanStyle = style.replace(/\n/g, "").replace(/\s\s+/g, " ");

    // Split by semicolon, but not semicolon inside ()
    let styleStr = cleanStyle
      .split(/;(?![^(]*\))/)
      .reduce<string>((acc, cur) => {
        // Split only the first colon
        const [k, v] = cur.split(/:(.+)/);
        if (k && v) {
          acc += `"${camelCase(k.trim())}": "${sanitizeJSON(v.trim())}",`;
        }
        return acc;
      }, "");

    if (styleStr.endsWith(",")) {
      styleStr = styleStr.slice(0, -1);
    }

    if (styleStr) {
      attrs += `"style":{${styleStr}},`;
    }
  }

  const src = element.getAttribute("src");

  if (src) {
    const width = element.getAttribute("width");
    const height = element.getAttribute("height");

    if (width && height) {
      attrs += `"src":"${sanitizeJSON(
        src
      )}", "width":"${width}", "height":"${height}",`;
    } else {
      console.warn(
        "Image missing width or height attribute as required by Satori"
      );
      attrs += `"src":"${sanitizeJSON(src)}",`;
    }
  }

  return attrs;
};

/**
 * Removes trailing comma from a string if present
 */
export const maybeRemoveTrailingComma = (str: string): string => {
  if (str.endsWith(",")) {
    return str.slice(0, -1);
  }
  return str;
};
