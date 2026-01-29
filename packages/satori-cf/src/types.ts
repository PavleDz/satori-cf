import type { Font } from "satori";

/**
 * Emoji provider types
 */
export type EmojiType =
  | "twemoji"
  | "openmoji"
  | "blobmoji"
  | "noto"
  | "fluent"
  | "fluentFlat";

/**
 * Options for generating OG images
 */
export interface OGOptions {
  /**
   * The width of the image.
   * @default 1200
   */
  width?: number;

  /**
   * The height of the image.
   * @default 630
   */
  height?: number;

  /**
   * Array of fonts to use for rendering.
   * If not provided, a default font will be loaded.
   */
  fonts?: Font[];

  /**
   * Emoji provider to use for rendering emojis.
   */
  emoji?: EmojiType;

  /**
   * Enable debug mode (disables caching).
   */
  debug?: boolean;
}

/**
 * Success result type
 */
export interface OGSuccess<T> {
  ok: true;
  value: T;
}

/**
 * Error result type
 */
export interface OGError {
  ok: false;
  error: Error;
}

/**
 * Discriminated union for results
 */
export type OGResult<T> = OGSuccess<T> | OGError;

/**
 * Item for batch processing
 */
export interface BatchItem {
  /**
   * The React element or HTML string to render
   */
  element: React.ReactNode | string;

  /**
   * Optional per-item options (merged with batch defaults)
   */
  options?: Partial<OGOptions>;
}

/**
 * Result for a single batch item
 */
export interface BatchResult {
  /**
   * Index of the item in the original batch
   */
  index: number;

  /**
   * The result of the generation
   */
  result: OGResult<string>;
}

/**
 * Options for batch processing
 */
export interface BatchOptions extends OGOptions {
  /**
   * Maximum number of concurrent generations.
   * @default 5
   */
  concurrency?: number;

  /**
   * Stop processing on first error.
   * @default false
   */
  failFast?: boolean;
}

/**
 * Item for stream processing
 */
export interface StreamItem {
  /**
   * The React element or HTML string to render
   */
  element: React.ReactNode | string;

  /**
   * Optional per-item options
   */
  options?: Partial<OGOptions>;
}

/**
 * Result yielded by the stream
 */
export interface StreamResult {
  /**
   * Index of the item
   */
  index: number;

  /**
   * The result of the generation
   */
  result: OGResult<string>;
}

/**
 * Options for stream processing
 */
export interface StreamOptions extends OGOptions {
  /**
   * Number of items to prefetch ahead.
   * @default 3
   */
  prefetch?: number;
}

/**
 * Options for Google Font loading
 */
export interface GoogleFontOptions {
  /**
   * Font family name
   */
  family: string;

  /**
   * Font weight
   */
  weight?: number;

  /**
   * Specific text to subset the font for
   */
  text?: string;
}

/**
 * Options for creating SVG response
 */
export interface SVGResponseOptions {
  /**
   * Custom headers to add to the response
   */
  headers?: HeadersInit;

  /**
   * HTTP status code
   * @default 200
   */
  status?: number;

  /**
   * HTTP status text
   */
  statusText?: string;

  /**
   * Disable caching (sets no-cache headers)
   * @default false
   */
  debug?: boolean;
}
