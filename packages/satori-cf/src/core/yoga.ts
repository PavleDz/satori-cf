import { init as initSatori } from "satori/wasm";
import initYoga from "yoga-wasm-web";

// @ts-expect-error .wasm files are not typed
import yogaWasm from "../../vendors/yoga.wasm";

/**
 * Module-level state for Yoga singleton
 */
const state: {
  yoga: ReturnType<typeof initYoga> extends Promise<infer T> ? T | null : never;
  initialized: boolean;
  initializing: Promise<void> | null;
} = {
  yoga: null,
  initialized: false,
  initializing: null,
};

/**
 * Ensures Yoga WASM is initialized exactly once.
 * Uses promise coalescing to prevent concurrent initialization race conditions.
 *
 * @returns Promise that resolves when Yoga is ready
 */
export async function ensureYogaInitialized(): Promise<void> {
  // Already initialized, return immediately
  if (state.initialized) {
    return;
  }

  // Initialization in progress, wait for it
  if (state.initializing) {
    return state.initializing;
  }

  // Start initialization
  state.initializing = (async () => {
    try {
      const yoga = await initYoga(yogaWasm as WebAssembly.Module);
      initSatori(yoga);
      state.yoga = yoga;
      state.initialized = true;
    } catch (err) {
      // Handle "Already initialized" gracefully
      if (err instanceof Error && err.message.includes("Already initialized")) {
        state.initialized = true;
        return;
      }
      throw err;
    } finally {
      state.initializing = null;
    }
  })();

  return state.initializing;
}

/**
 * Check if Yoga has been initialized
 */
export function isInitialized(): boolean {
  return state.initialized;
}
