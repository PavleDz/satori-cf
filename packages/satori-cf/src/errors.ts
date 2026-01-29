/**
 * Base error class for satori-cf errors
 */
export class SatoriCFError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SatoriCFError";
  }
}

/**
 * Error thrown when WASM initialization fails
 */
export class WASMInitError extends SatoriCFError {
  constructor(message: string) {
    super(message);
    this.name = "WASMInitError";
  }
}

/**
 * Error thrown when font loading fails
 */
export class FontLoadError extends SatoriCFError {
  constructor(message: string) {
    super(message);
    this.name = "FontLoadError";
  }
}

/**
 * Error thrown when HTML parsing fails
 */
export class HTMLParseError extends SatoriCFError {
  constructor(message: string) {
    super(message);
    this.name = "HTMLParseError";
  }
}

/**
 * Error thrown when SVG generation fails
 */
export class SVGGenerationError extends SatoriCFError {
  constructor(message: string) {
    super(message);
    this.name = "SVGGenerationError";
  }
}
