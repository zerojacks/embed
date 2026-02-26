// Protocol types based on the actual WASM implementation
export type ProtocolType = 'CSG13' | 'CSG16' | 'DLT/645-2007' | 'moudle' | 'MS' | 'His' | 'Unknown'

export interface AnalysisResult {
  protocol: string
  region: string
  data: any[]
  success: boolean
}

export interface ConfigItem {
  id: string
  name: string
  description: string
}

export interface ConfigItemsResponse {
  protocol: string
  region: string
  items: ConfigItem[]
}

export interface XmlElement {
  name: string
  attributes: Record<string, string>
  value?: string
  children: XmlElement[]
}

// WASM FrameAnalyzer interface - matches the actual WASM exports
export interface WasmFrameAnalyzer {
  /**
   * Main frame processing function - auto-detects protocol and analyzes frame
   * Returns JSON string with protocol and parsed data
   */
  process_frame(frame_data: Uint8Array): string
  
  /**
   * Convert hex string to byte array
   */
  hex_to_bytes(hex_string: string): Uint8Array
  
  /**
   * Convert byte array to hex string with spaces
   */
  bytes_to_hex(data: Uint8Array): string
  
  /**
   * Detect frame protocol type
   */
  detect_protocol(frame_data: Uint8Array): string
  
  /**
   * Analyze DLT645 frame and return JSON result
   */
  analyze_645_frame(frame_data: Uint8Array): string
  
  /**
   * Analyze CCO frame and return JSON result
   */
  analyze_cco_frame(frame_data: Uint8Array): string
  
  /**
   * Analyze CSG frame and return JSON result
   */
  analyze_csg_frame(frame_data: Uint8Array): string
  
  /**
   * Free the WASM memory
   */
  free(): void
}

// Extended interface for our application use
export interface WasmAnalyzer extends WasmFrameAnalyzer {
  // Custom method for hex string conversion with validation
  get_frame_array_from_str(hex_str: string): Uint8Array
}

// Response format from process_frame method
export interface ProcessFrameResponse {
  protocol: string
  region: string
  data: any[]
}

// Available protocols response format
export interface AvailableProtocolsResponse {
  protocols: string[]
}