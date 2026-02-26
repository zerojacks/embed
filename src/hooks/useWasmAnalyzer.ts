import { useState, useEffect, useRef } from 'react'
import type { AnalysisResult, ProtocolType, ProcessFrameResponse } from '../types'
import { toast } from 'react-hot-toast'
import { FrameAnalyzer } from '../../pkg-web/embed_core'

export const useWasmAnalyzer = (region: string = '南网') => {
  const [analyzer, setAnalyzer] = useState<FrameAnalyzer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableProtocols, setAvailableProtocols] = useState<string[]>([])
  const analyzerRef = useRef<FrameAnalyzer | null>(null)

  useEffect(() => {
    let mounted = true

    const initWasm = async () => {
      try {
        setIsLoading(true)
        setError(null)

        console.log('初始化WASM模块...')
        // Dynamic import of the WASM module
        const wasmModule = await import('../../pkg-web/embed_core')

        // Initialize the WASM module first
        await wasmModule.default()

        if (!mounted) return

        // Create analyzer instance and extend it with custom methods
        const frameAnalyzer = new wasmModule.FrameAnalyzer(region)

        
        console.log('WASM模块初始化成功')

        if (mounted) {
          setAnalyzer(frameAnalyzer)
          analyzerRef.current = frameAnalyzer

          // Set default available protocols since get_available_protocols is not available
          setAvailableProtocols(['CSG13', 'CSG16', 'DLT/645-2007', 'moudle', 'MS', 'His'])
          toast.success('WASM模块加载成功')
        }
      } catch (err) {
        console.error('Failed to initialize WASM:', err)
        if (mounted) {
          setError('WASM模块初始化失败')
          toast.error('WASM模块加载失败')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initWasm()

    return () => {
      mounted = false
      if (analyzerRef.current) {
        try {
          analyzerRef.current.free()
        } catch (err) {
          console.warn('Failed to free WASM analyzer:', err)
        }
      }
    }
  }, [region])

  const analyzeFrame = async (
    hexData: string,
    protocolType: ProtocolType | 'auto' = 'auto'
  ): Promise<AnalysisResult> => {
    if (!analyzer) {
      throw new Error('WASM analyzer not initialized')
    }

    try {
      // Clean and validate hex string
      const cleanHexData = hexData.replace(/\s+/g, '').toUpperCase()
      
      // Validate hex string format
      if (!/^[0-9A-F]*$/.test(cleanHexData)) {
        throw new Error('输入包含无效的十六进制字符')
      }
      
      if (cleanHexData.length === 0) {
        throw new Error('输入数据为空')
      }
      
      if (cleanHexData.length % 2 !== 0) {
        throw new Error('十六进制数据长度必须为偶数')
      }

      // Minimum frame length check (at least 4 bytes for most protocols)
      if (cleanHexData.length < 8) {
        throw new Error('报文数据太短，至少需要4个字节')
      }

      console.log(`Analyzing frame: ${cleanHexData} with protocol: ${protocolType}`)

      // Convert hex string to bytes using the available hex_to_bytes method
      let frameData: Uint8Array
      try {
        frameData = analyzer.hex_to_bytes(cleanHexData)
      } catch (conversionError) {
        console.error('Hex conversion error:', conversionError)
        throw new Error('十六进制数据转换失败')
      }

      if (!frameData || frameData.length === 0) {
        throw new Error('转换后的数据为空')
      }

      console.log(`Frame data length: ${frameData.length} bytes (索引):${frameData.length}`)

      // Use the unified process_frame method - it auto-detects protocol
      let result: string
      try {
        result = analyzer.process_frame(frameData)
      } catch (processError) {
        console.error('Frame processing error:', processError)
        throw new Error('报文处理失败')
      }

      if (!result) {
        throw new Error('解析结果为空')
      }

      // Parse the JSON result
      let parsedResult: ProcessFrameResponse
      try {
        parsedResult = JSON.parse(result)
      } catch (parseError) {
        console.error('JSON parsing error:', parseError)
        console.error('Raw result:', result)
        throw new Error('解析结果格式错误')
      }

      return {
        protocol: parsedResult.protocol || 'Unknown',
        region: parsedResult.region || region,
        data: parsedResult.data || [],
        success: true
      }
    } catch (err) {
      console.error('Frame analysis error:', err)

      return {
        protocol: 'Unknown',
        region: region,
        data: [],
        success: false,
      }
    }
  }

  const convertHexToBytes = (hexData: string): Uint8Array => {
    if (!analyzer) {
      throw new Error('WASM analyzer not initialized')
    }
    return analyzer.hex_to_bytes(hexData)
  }

  const convertBytesToHex = (data: Uint8Array): string => {
    if (!analyzer) {
      throw new Error('WASM analyzer not initialized')
    }
    return analyzer.bytes_to_hex(data)
  }

  const getAvailableProtocols = (): string[] => {
    return availableProtocols
  }

  return {
    analyzer,
    isLoading,
    error,
    availableProtocols,
    analyzeFrame,
    convertHexToBytes,
    convertBytesToHex,
    getAvailableProtocols
  }
}
