/* tslint:disable */
/* eslint-disable */

export class FrameAnalyzer {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Convert byte array to hex string with spaces
     */
    bytes_to_hex(data: Uint8Array): string;
    /**
     * Get available protocols
     */
    get_available_protocols(): string;
    /**
     * Convert hex string to byte array with validation
     */
    get_frame_array_from_str(hex_str: string): Uint8Array;
    /**
     * Convert hex string to byte array
     */
    hex_to_bytes(hex_string: string): Uint8Array;
    constructor();
    /**
     * Main frame processing function - auto-detects protocol and analyzes frame
     */
    process_frame(frame_data: Uint8Array, region: string): string;
    update_protocol_config(protocol: string, content: string): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_frameanalyzer_free: (a: number, b: number) => void;
    readonly frameanalyzer_new: () => number;
    readonly frameanalyzer_process_frame: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly frameanalyzer_hex_to_bytes: (a: number, b: number, c: number) => [number, number, number, number];
    readonly frameanalyzer_bytes_to_hex: (a: number, b: number, c: number) => [number, number];
    readonly frameanalyzer_get_frame_array_from_str: (a: number, b: number, c: number) => [number, number, number, number];
    readonly frameanalyzer_get_available_protocols: (a: number) => [number, number];
    readonly frameanalyzer_update_protocol_config: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
