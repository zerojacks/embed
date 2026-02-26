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