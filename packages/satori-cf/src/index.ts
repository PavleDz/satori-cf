// Generators
export { generateOG } from "./generators/single";
export { generateOGBatch } from "./generators/batch";
export { OGStream } from "./generators/stream";

// Utilities
export { loadGoogleFont } from "./assets/font";
export { loadDynamicAsset } from "./assets/emoji";
export { parseHtml } from "./html/parser";
export { createSVGResponse } from "./utils/response";

// Core
export { ensureYogaInitialized, isInitialized } from "./core/yoga";

// Types
export type {
  OGOptions,
  OGResult,
  OGSuccess,
  OGError,
  BatchItem,
  BatchResult,
  BatchOptions,
  StreamItem,
  StreamResult,
  StreamOptions,
  GoogleFontOptions,
  SVGResponseOptions,
  EmojiType,
} from "./types";

// Errors
export {
  SatoriCFError,
  WASMInitError,
  FontLoadError,
  HTMLParseError,
  SVGGenerationError,
} from "./errors";
