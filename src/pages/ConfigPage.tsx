import React, { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'react-hot-toast'
import {
    FileText,
    Settings,
    Download,
    RotateCcw,
    Upload,
    Search,
    X
} from 'lucide-react'
import { useWasm } from '../contexts/WasmContext'
import type { ProtocolType, ItemConfigList, ItemListResponse } from '../types'
import VirtualConfigItemList from '../components/VirtualConfigItemList'

interface ProtocolConfig {
    type: ProtocolType
    name: string
    content: string
    uploadTime: Date
    isDefault: boolean
    filePath?: string
    fileSize?: number
}

const default_config: Record<string, string> = {
    'CSG13': 'CSG13',
    'DLT/645-2007': 'DLT645',
    'CSG16': 'CSG16',
    'moudle': 'MOUDLE',
    'MS': 'TASK_MS'
}

const ConfigPage: React.FC = () => {
    const { isLoading: wasmLoading, updateProtocolConfig, getAvailableProtocols, resetProtocolConfig, getAllConfigItems } = useWasm()
    const [protocolConfigs, setProtocolConfigs] = useState<ProtocolConfig[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [initialized, setInitialized] = useState(false)
    const [showResetModal, setShowResetModal] = useState(false)
    const [resetProtocolType, setResetProtocolType] = useState<string>('')
    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

    // 搜索相关状态
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [showSearchModal, setShowSearchModal] = useState(false)
    const [configItems, setConfigItems] = useState<ItemConfigList[]>([])
    const [filteredItems, setFilteredItems] = useState<ItemConfigList[]>([])
    const [searchLoading, setSearchLoading] = useState(false)

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

    // 获取配置项数据
    const fetchConfigItems = async () => {
        setSearchLoading(true)
        try {
            const result = await getAllConfigItems()
            if (result) {
                // 假设返回的是 JSON 字符串，需要解析
                const response: ItemListResponse = JSON.parse(result)
                if (response.success && response.data) {
                    setConfigItems(response.data)
                    setFilteredItems(response.data)
                } else {
                    toast.error('获取配置项失败: ' + (response.error || '未知错误'))
                }
            }
        } catch (error) {
            console.error('Failed to fetch config items:', error)
            toast.error('获取配置项失败')
        } finally {
            setSearchLoading(false)
        }
    }

    // 搜索过滤函数
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query)
        if (!query.trim()) {
            setFilteredItems(configItems)
            return
        }

        const filtered = configItems.filter(item => {
            const searchTerm = query.toLowerCase()
            return (
                item.item?.toLowerCase().includes(searchTerm) ||
                item.name?.toLowerCase().includes(searchTerm) ||
                item.protocol?.toLowerCase().includes(searchTerm) ||
                item.region?.toLowerCase().includes(searchTerm) ||
                item.dir?.toLowerCase().includes(searchTerm)
            )
        })
        setFilteredItems(filtered)
    }, [configItems])

    // 打开搜索模态框
    const openSearchModal = () => {
        setShowSearchModal(true)
        if (configItems.length === 0) {
            fetchConfigItems()
        }
    }

    // 关闭搜索模态框
    const closeSearchModal = () => {
        setShowSearchModal(false)
        setSearchQuery('')
        setFilteredItems(configItems)
    }

    // 处理快捷键
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl+F (Windows/Linux) 或 Cmd+F (Mac) 打开搜索
            if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
                event.preventDefault() // 阻止浏览器默认的查找功能
                openSearchModal()
            }
            // ESC 键关闭搜索模态框
            if (event.key === 'Escape' && showSearchModal) {
                closeSearchModal()
            }
        }

        // 添加事件监听器
        document.addEventListener('keydown', handleKeyDown)

        // 清理事件监听器
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [showSearchModal]) // 依赖 showSearchModal 状态
    const getProtocolName = (type: string): string => {
        const names: Record<string, string> = {
            'CSG13': 'CSG13 协议',
            'DLT/645-2007': 'DLT645 协议',
            'CSG16': 'CSG16 协议',
            'moudle': 'MOUDLE 协议',
            'MS': 'TASK_MS 协议'
        }
        return names[type] || `${type} 协议`
    }

    // 显示重置确认对话框
    const showResetConfirmation = (protocolType: string) => {
        setResetProtocolType(protocolType)
        setShowResetModal(true)
    }

    // 确认重置协议配置
    const confirmResetConfig = async () => {
        setShowResetModal(false)

        try {
            setIsLoading(true)

            await resetProtocolConfig(resetProtocolType as ProtocolType)
            // 创建默认配置
            const defaultConfig = createDefaultConfig(resetProtocolType)

            // 更新本地状态
            setProtocolConfigs(prev =>
                prev.map(config =>
                    config.type === resetProtocolType ? defaultConfig : config
                )
            )

            // 从 localStorage 中删除自定义配置
            const storageKey = `protocol_config_${resetProtocolType}`
            localStorage.removeItem(storageKey)

            toast.success(`${getProtocolName(resetProtocolType)} 已重置为默认配置`)
        } catch (error) {
            console.error('Failed to reset config:', error)
            toast.error('重置配置失败')
        } finally {
            setIsLoading(false)
            setResetProtocolType('')
        }
    }

    // 导出协议配置
    const handleExportConfig = async (config: ProtocolConfig) => {
        try {
            if (config.isDefault || !config.content) {
                // 下载默认配置文件
                const configUrl = `/config/${default_config[config.type]}.xml`
                const response = await fetch(configUrl)

                if (!response.ok) {
                    throw new Error(`无法获取默认配置文件: ${response.statusText}`)
                }

                const blob = await response.blob()
                const url = URL.createObjectURL(blob)

                const a = document.createElement('a')
                a.href = url
                a.download = `${config.type}_default.xml`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)

                toast.success(`${getProtocolName(config.type)} 默认配置下载成功`)
            } else {
                // 导出自定义配置
                const blob = new Blob([config.content], { type: 'application/xml' })
                const url = URL.createObjectURL(blob)

                const a = document.createElement('a')
                a.href = url
                a.download = `${config.type}_custom.xml`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)

                toast.success(`${getProtocolName(config.type)} 自定义配置导出成功`)
            }
        } catch (error) {
            console.error('Failed to export config:', error)
            toast.error(`${getProtocolName(config.type)} 配置导出失败`)
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
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="card-title">已配置的协议</h2>
                        {/* DaisyUI 搜索框 */}
                        <label className="input input-bordered flex items-center gap-2 w-80">
                            <svg 
                                className="h-4 w-4 opacity-70" 
                                xmlns="http://www.w3.org/2000/svg" 
                                viewBox="0 0 24 24"
                            >
                                <g
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                    strokeWidth="2"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.3-4.3"></path>
                                </g>
                            </svg>
                            <input 
                                type="search" 
                                className="grow" 
                                placeholder="搜索配置项..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                onFocus={openSearchModal}
                            />
                            <kbd className="kbd kbd-sm">Ctrl</kbd>
                            <kbd className="kbd kbd-sm">F</kbd>
                        </label>
                    </div>

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
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm text-warning"
                                                    onClick={() => showResetConfirmation(config.type)}
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

            {/* 重置确认对话框 */}
            {showResetModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">确认重置配置</h3>
                        <p className="py-4">
                            确定要重置 <span className="font-semibold text-warning">{getProtocolName(resetProtocolType)}</span> 到默认配置吗？
                        </p>
                        <p className="text-sm text-base-content/60 mb-4">
                            此操作将删除当前的自定义配置，恢复为系统默认配置，且无法撤销。
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => setShowResetModal(false)}
                            >
                                取消
                            </button>
                            <button
                                className="btn btn-warning"
                                onClick={confirmResetConfig}
                            >
                                确认重置
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* 搜索配置项模态框 */}
            {showSearchModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-4xl w-full max-h-[90vh]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">搜索配置项</h3>
                            <button
                                className="btn btn-sm btn-circle btn-ghost"
                                onClick={closeSearchModal}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 搜索输入框 */}
                        <div className="form-control mb-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="搜索配置项 (支持搜索数据项ID、名称、协议、省份)"
                                    className="input input-bordered w-full pl-10"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
                            </div>
                        </div>

                        {/* 搜索结果统计 */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-base-content/70">
                                {searchQuery ? `找到 ${filteredItems.length} 个匹配项` : `共 ${configItems.length} 个配置项`}
                            </span>
                            {searchLoading && (
                                <div className="flex items-center gap-2">
                                    <div className="loading loading-spinner loading-sm"></div>
                                    <span className="text-sm">加载中...</span>
                                </div>
                            )}
                        </div>

                        {/* 搜索结果列表 */}
                        <div className="h-96">
                            {searchLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="loading loading-spinner loading-lg"></div>
                                    <span className="ml-2">正在获取配置项...</span>
                                </div>
                            ) : (
                                <VirtualConfigItemList
                                    items={filteredItems}
                                    height={384} // 24rem = 384px
                                    itemHeight={48} // 匹配新的紧凑布局高度
                                />
                            )}
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={closeSearchModal}>close</button>
                    </form>
                </div>
            )}
        </div>
    )
}

export default ConfigPage