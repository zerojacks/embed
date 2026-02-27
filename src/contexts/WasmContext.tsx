import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { AnalysisResult, ProtocolType, ProcessFrameResponse } from '../types'
import { toast } from 'react-hot-toast'
import { wasmManager } from '../utils/wasmManager'
import { FrameAnalyzer } from '../../pkg-web/embed_core'

interface WasmContextType {
    analyzer: FrameAnalyzer | null
    isLoading: boolean
    error: string | null
    availableProtocols: string[]
    analyzeFrame: (hexData: string, region: string) => Promise<AnalysisResult>
    convertHexToBytes: (hexData: string) => Uint8Array
    convertBytesToHex: (data: Uint8Array) => string
    getAvailableProtocols: () => string[]
    updateProtocolConfig: (protocol: ProtocolType, content: string) => Promise<void>
    resetProtocolConfig: (protocol: ProtocolType) => Promise<void>
}

const WasmContext = createContext<WasmContextType | null>(null)

interface WasmProviderProps {
    children: ReactNode
    region?: string
}

export const WasmProvider: React.FC<WasmProviderProps> = ({
    children,
    region = '南网'
}) => {
    const [analyzer, setAnalyzer] = useState<FrameAnalyzer | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [availableProtocols] = useState<string[]>(['CSG13', 'CSG16', 'DLT/645-2007', 'moudle', 'MS'])

    useEffect(() => {
        const initWasm = async () => {
            try {
                setIsLoading(true)
                setError(null)

                const wasmAnalyzer = await wasmManager.getAnalyzer()
                setAnalyzer(wasmAnalyzer)
            } catch (err) {
                console.error('WASM初始化失败:', err)
                setError('WASM模块初始化失败')
            } finally {
                setIsLoading(false)
            }
        }

        initWasm()
    }, [region])

    const analyzeFrame = async (
        hexData: string,
        region: string = '南网'
    ): Promise<AnalysisResult> => {
        if (!analyzer) {
            throw new Error('WASM analyzer not initialized')
        }

        try {
            const cleanHexData = hexData.replace(/\s+/g, '').toUpperCase()

            if (!/^[0-9A-F]*$/.test(cleanHexData)) {
                throw new Error('输入包含无效的十六进制字符')
            }

            if (cleanHexData.length === 0) {
                throw new Error('输入数据为空')
            }

            if (cleanHexData.length % 2 !== 0) {
                throw new Error('十六进制数据长度必须为偶数')
            }

            if (cleanHexData.length < 8) {
                throw new Error('报文数据太短，至少需要4个字节')
            }

            const frameData = analyzer.hex_to_bytes(cleanHexData)
            const result = analyzer.process_frame(frameData, region)
            const parsedResult: ProcessFrameResponse = JSON.parse(result)

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

    const updateProtocolConfig = async (protocol: ProtocolType, content: string): Promise<void> => {
        if (!analyzer) {
            throw new Error('WASM analyzer not initialized')
        }
        try {
            analyzer.update_protocol_config(protocol, content)
            toast.success(`${protocol} 协议配置更新成功`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '配置更新失败'
            toast.error(errorMessage)
            throw error
        }
    }

    const resetProtocolConfig = async (protocol: ProtocolType): Promise<void> => {
        if (!analyzer) {
            throw new Error('WASM analyzer not initialized')
        }
        try {
            analyzer.reset_protocol_config(protocol)
            toast.success(`${protocol} 协议配置已重置`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '配置重置失败'
            toast.error(errorMessage)
            throw error
        }
    }

    const contextValue: WasmContextType = {
        analyzer,
        isLoading,
        error,
        availableProtocols,
        analyzeFrame,
        convertHexToBytes,
        convertBytesToHex,
        getAvailableProtocols,
        updateProtocolConfig,
        resetProtocolConfig
    }

    return (
        <WasmContext.Provider value={contextValue}>
            {children}
        </WasmContext.Provider>
    )
}

export const useWasm = (): WasmContextType => {
    const context = useContext(WasmContext)
    if (!context) {
        throw new Error('useWasm must be used within a WasmProvider')
    }
    return context
}