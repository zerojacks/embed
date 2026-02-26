import React, { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'react-hot-toast'
import {
    FileText,
    Settings,
    Download,
    RotateCcw,
    Upload
} from 'lucide-react'
import { useWasm } from '../contexts/WasmContext'
import type { ProtocolType } from '../types'

interface ProtocolConfig {
    type: ProtocolType
    name: string
    content: string
    uploadTime: Date
    isDefault: boolean
    filePath?: string
    fileSize?: number
}

const ConfigPage: React.FC = () => {
    const { isLoading: wasmLoading, updateProtocolConfig, getAvailableProtocols } = useWasm()
    const [protocolConfigs, setProtocolConfigs] = useState<ProtocolConfig[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [initialized, setInitialized] = useState(false)
    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

    // 处理文件选择
    const handleFileSelect = async (protocolType: string, file: File) => {
        // 验证文件类型
        if (!file.name.toLowerCase().endsWith('.xml')) {
            toast.error('请选择 XML 格式的配置文件')
            return
        }

        // 验证文件大小 (最大 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('文件大小不能超过 5MB')
            return
        }

        try {
            // 读取文件内容
            const content = await readFileContent(file)

            // 简单验证 XML 格式
            if (!isValidXml(content)) {
                toast.error('无效的 XML 文件格式')
                return
            }

            // 上传配置
            await handleConfigUpload(protocolType, content, file.name)
        } catch (error) {
            console.error('File processing failed:', error)
            toast.error('文件处理失败')
        }
    }

    // 读取文件内容
    const readFileContent = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.onerror = (e) => reject(e)
            reader.readAsText(file, 'UTF-8')
        })
    }

    // 验证 XML 格式
    const isValidXml = (content: string): boolean => {
        try {
            const parser = new DOMParser()
            const doc = parser.parseFromString(content, 'text/xml')
            const parseError = doc.querySelector('parsererror')
            return !parseError
        } catch {
            return false
        }
    }

    // 触发文件选择
    const triggerFileUpload = (protocolType: string) => {
        const input = fileInputRefs.current[protocolType]
        if (input) {
            input.click()
        }
    }

    // 从 localStorage 加载配置状态
    const loadConfigsFromStorage = useCallback(() => {
        const availableProtocols = getAvailableProtocols()
        const configs: ProtocolConfig[] = []

        availableProtocols.forEach(protocol => {
            const storageKey = `protocol_config_${protocol}`
            const storedConfig = localStorage.getItem(storageKey)

            if (storedConfig) {
                try {
                    const parsed = JSON.parse(storedConfig)
                    configs.push({
                        type: protocol as ProtocolType,
                        name: getProtocolName(protocol),
                        content: parsed.content || '',
                        uploadTime: new Date(parsed.uploadTime),
                        isDefault: parsed.isDefault || false,
                        filePath: parsed.filePath,
                        fileSize: parsed.fileSize
                    })
                } catch (error) {
                    console.error(`Failed to parse stored config for ${protocol}:`, error)
                    // 如果解析失败，创建默认配置
                    configs.push(createDefaultConfig(protocol))
                }
            } else {
                // 没有存储的配置，创建默认配置
                configs.push(createDefaultConfig(protocol))
            }
        })

        return configs.sort((a, b) => a.type.localeCompare(b.type))
    }, [getAvailableProtocols])

    // 创建默认配置
    const createDefaultConfig = (protocol: string): ProtocolConfig => ({
        type: protocol as ProtocolType,
        name: getProtocolName(protocol),
        content: '',
        uploadTime: new Date(),
        isDefault: true
    })

    // 保存配置到 localStorage
    const saveConfigToStorage = useCallback((config: ProtocolConfig) => {
        const storageKey = `protocol_config_${config.type}`
        const configToStore = {
            content: config.content,
            uploadTime: config.uploadTime.toISOString(),
            isDefault: config.isDefault,
            filePath: config.filePath,
            fileSize: config.fileSize
        }
        localStorage.setItem(storageKey, JSON.stringify(configToStore))
    }, [])

    // 初始化配置状态
    useEffect(() => {
        if (!wasmLoading && !initialized) {
            const configs = loadConfigsFromStorage()
            setProtocolConfigs(configs)
            setInitialized(true)
        }
    }, [wasmLoading, initialized, loadConfigsFromStorage])

    // 处理协议配置上传
    const handleConfigUpload = async (protocolType: string, content: string, fileName?: string) => {
        setIsLoading(true)

        try {
            // 使用 WASM 的 updateProtocolConfig 函数
            await updateProtocolConfig(protocolType as ProtocolType, content)

            // 创建新配置
            const newConfig: ProtocolConfig = {
                type: protocolType as ProtocolType,
                name: getProtocolName(protocolType),
                content,
                uploadTime: new Date(),
                isDefault: false,
                filePath: fileName,
                fileSize: content.length
            }

            // 更新本地状态
            setProtocolConfigs(prev => {
                const filtered = prev.filter(config => config.type !== protocolType)
                const updated = [...filtered, newConfig].sort((a, b) => a.type.localeCompare(b.type))
                return updated
            })

            // 保存到 localStorage
            saveConfigToStorage(newConfig)

            toast.success(`${getProtocolName(protocolType)} 配置更新成功`)
        } catch (error) {
            console.error('Failed to upload config:', error)
            const errorMessage = error instanceof Error ? error.message : '配置上传失败'
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    // 获取协议显示名称
    const getProtocolName = (type: string): string => {
        const names: Record<string, string> = {
            'CSG13': 'CSG13 协议',
            'DLT645': 'DLT645 协议',
            'CSG16': 'CSG16 协议',
            'MOUDLE': 'MOUDLE 协议',
            'TASK_MS': 'TASK_MS 协议'
        }
        return names[type] || type
    }

    // 重置协议配置到默认状态
    const handleResetConfig = async (protocolType: string) => {
        if (!confirm(`确定要重置 ${getProtocolName(protocolType)} 到默认配置吗？`)) {
            return
        }

        try {
            setIsLoading(true)

            // 创建默认配置
            const defaultConfig = createDefaultConfig(protocolType)

            // 更新本地状态
            setProtocolConfigs(prev =>
                prev.map(config =>
                    config.type === protocolType ? defaultConfig : config
                )
            )

            // 从 localStorage 中删除自定义配置
            const storageKey = `protocol_config_${protocolType}`
            localStorage.removeItem(storageKey)

            toast.success(`${getProtocolName(protocolType)} 已重置为默认配置`)
        } catch (error) {
            console.error('Failed to reset config:', error)
            toast.error('重置配置失败')
        } finally {
            setIsLoading(false)
        }
    }

    // 导出协议配置
    const handleExportConfig = (config: ProtocolConfig) => {
        if (config.isDefault || !config.content) {
            toast.error('默认配置无法导出，请先上传自定义配置')
            return
        }

        try {
            const blob = new Blob([config.content], { type: 'application/xml' })
            const url = URL.createObjectURL(blob)

            const a = document.createElement('a')
            a.href = url
            a.download = `${config.type}.xml`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success('配置导出成功')
        } catch (error) {
            console.error('Failed to export config:', error)
            toast.error('配置导出失败')
        }
    }

    if (wasmLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="loading loading-spinner loading-lg"></div>
                <span className="ml-2">加载配置管理器...</span>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col p-4 space-y-4">
            {/* 已上传的配置列表 */}
            <div className="card bg-base-100 shadow-xl flex-1">
                <div className="card-body">
                    <h2 className="card-title">已配置的协议</h2>

                    {protocolConfigs.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-base-content/60">
                            暂无协议配置，请上传配置文件
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {protocolConfigs.map((config) => (
                                <div key={config.type} className="card bg-base-200 shadow-sm">
                                    <div className="card-body p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="text-primary">
                                                    {config.isDefault ? (
                                                        <Settings className="w-8 h-8" />
                                                    ) : (
                                                        <FileText className="w-8 h-8" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="font-semibold">{config.name}</h3>
                                                        {config.isDefault ? (
                                                            <span className="badge badge-outline badge-sm">默认</span>
                                                        ) : (
                                                            <span className="badge badge-success badge-sm">自定义</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-base-content/60">
                                                        {config.isDefault ? '使用内置默认配置' : `上传时间: ${config.uploadTime.toLocaleString()}`}
                                                    </p>
                                                    {!config.isDefault && config.filePath && (
                                                        <p className="text-sm text-base-content/60">
                                                            文件名: {config.filePath}
                                                        </p>
                                                    )}
                                                    {!config.isDefault && (
                                                        <p className="text-sm text-base-content/60">
                                                            配置大小: {((config.fileSize || config.content.length) / 1024).toFixed(1)} KB
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex space-x-2">
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => triggerFileUpload(config.type)}
                                                    title="上传配置文件"
                                                    disabled={isLoading}
                                                >
                                                    <Upload className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleExportConfig(config)}
                                                    title="导出配置"
                                                    disabled={config.isDefault}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm text-warning"
                                                    onClick={() => handleResetConfig(config.type)}
                                                    title="重置为默认配置"
                                                    disabled={config.isDefault}
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 隐藏的文件输入元素 */}
            {protocolConfigs.map((config) => (
                <input
                    key={config.type}
                    ref={(el) => {
                        fileInputRefs.current[config.type] = el
                    }}
                    type="file"
                    accept=".xml"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                            handleFileSelect(config.type, file)
                        }
                        // 清空输入值，允许重复选择同一文件
                        e.target.value = ''
                    }}
                />
            ))}

            {/* 加载状态 */}
            {isLoading && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                    <div className="bg-base-100 p-6 rounded-lg shadow-xl flex items-center space-x-3">
                        <div className="loading loading-spinner loading-md"></div>
                        <span>正在处理配置...</span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ConfigPage