import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useThemeStore } from '../../stores/useThemeStore'
import {
    Code2,
    Minimize2,
    CheckCircle,
    Quote,
    FileX,
    Eye,
    Copy,
    Trash2,
    FileText,
    ChevronRight,
    ChevronDown,
    AlertCircle,
    Hash,
    Type,
    ToggleLeft,
    Braces,
    Brackets,
    ArrowLeft
} from 'lucide-react'

// 类型定义
type JsonMode = 'format' | 'minify' | 'validate' | 'escape' | 'unescape' | 'escape-minify' | 'visualize'

// JSON 语法高亮组件
interface JsonSyntaxHighlightProps {
    json: string
    className?: string
}

function JsonSyntaxHighlight({ json, className = '' }: JsonSyntaxHighlightProps) {
    const { resolvedTheme } = useThemeStore()
    const isDarkTheme = resolvedTheme === 'dark'

    if (!json || json === 'VISUALIZE_MODE') {
        return null
    }

    // 创建完全透明的自定义样式，避免背景横线问题
    const baseStyle = isDarkTheme ? oneDark : oneLight
    const customStyle = {
        ...baseStyle,
        'pre[class*="language-"]': {
            ...baseStyle['pre[class*="language-"]'],
            background: 'transparent !important',
            backgroundColor: 'transparent !important',
            margin: 0,
            padding: 0,
            fontSize: '0.875rem',
            lineHeight: '1.5',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            border: 'none',
            borderRadius: 0,
            boxShadow: 'none',
        },
        'code[class*="language-"]': {
            ...baseStyle['code[class*="language-"]'],
            background: 'transparent !important',
            backgroundColor: 'transparent !important',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        }
    }

    return (
        <SyntaxHighlighter
            language="json"
            style={customStyle}
            customStyle={{
                background: 'transparent',
                backgroundColor: 'transparent',
                padding: 0,
                margin: 0,
                fontSize: '0.875rem',
                lineHeight: '1.5',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                border: 'none',
                borderRadius: 0,
                boxShadow: 'none',
            }}
            className={className}
            wrapLongLines={true}
            showLineNumbers={false}
        >
            {json}
        </SyntaxHighlighter>
    )
}
interface JsonTreeNodeProps {
    keyName?: string
    value: any
    level?: number
}

function JsonTreeNode({ keyName, value, level = 0 }: JsonTreeNodeProps) {
    const [collapsed, setCollapsed] = useState(false)

    const getValueType = (val: any) => {
        if (val === null) return 'null'
        if (Array.isArray(val)) return 'array'
        return typeof val
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'string': return 'text-success'
            case 'number': return 'text-info'
            case 'boolean': return 'text-warning'
            case 'null': return 'text-base-content/50'
            case 'array': return 'text-secondary'
            case 'object': return 'text-accent'
            default: return 'text-base-content/50'
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'string': return <Type className="w-3 h-3" />
            case 'number': return <Hash className="w-3 h-3" />
            case 'boolean': return <ToggleLeft className="w-3 h-3" />
            case 'null': return <AlertCircle className="w-3 h-3" />
            case 'array': return <Brackets className="w-3 h-3" />
            case 'object': return <Braces className="w-3 h-3" />
            default: return <FileText className="w-3 h-3" />
        }
    }

    const type = getValueType(value)
    const typeColor = getTypeColor(type)

    if (type === 'object' && value !== null) {
        const entries = Object.entries(value)
        const isEmpty = entries.length === 0

        return (
            <div className="select-none">
                <div className="flex items-center hover:bg-base-200 rounded px-2 py-1 cursor-pointer group">
                    <div className="flex items-center" style={{ marginLeft: `${level * 20}px` }}>
                        {keyName && (
                            <>
                                <span className="text-secondary font-mono text-sm">"{keyName}"</span>
                                <span className="text-base-content mx-1">:</span>
                            </>
                        )}
                        {!isEmpty && (
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                className="text-base-content/60 hover:text-base-content mr-2 p-0.5 rounded hover:bg-base-300"
                            >
                                {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                        )}
                        <span className="text-base-content font-mono">{'{'}</span>
                        <div className={`ml-2 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-base-300 ${typeColor}`}>
                            {getTypeIcon(type)}
                            <span>Object{!isEmpty && ` (${entries.length})`}</span>
                        </div>
                    </div>
                </div>
                {!isEmpty && !collapsed && (
                    <div className="ml-2">
                        {entries.map(([key, val]) => (
                            <JsonTreeNode
                                key={key}
                                keyName={key}
                                value={val}
                                level={level + 1}
                            />
                        ))}
                    </div>
                )}
                <div className="font-mono text-sm text-base-content px-2" style={{ marginLeft: `${level * 20}px` }}>
                    <span>{'}'}</span>
                </div>
            </div>
        )
    }

    if (type === 'array') {
        const isEmpty = value.length === 0

        return (
            <div className="select-none">
                <div className="flex items-center hover:bg-base-200 rounded px-2 py-1 cursor-pointer group">
                    <div className="flex items-center" style={{ marginLeft: `${level * 20}px` }}>
                        {keyName && (
                            <>
                                <span className="text-secondary font-mono text-sm">"{keyName}"</span>
                                <span className="text-base-content mx-1">:</span>
                            </>
                        )}
                        {!isEmpty && (
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                className="text-base-content/60 hover:text-base-content mr-2 p-0.5 rounded hover:bg-base-300"
                            >
                                {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                        )}
                        <span className="text-base-content font-mono">{'['}</span>
                        <div className={`ml-2 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-base-300 ${typeColor}`}>
                            {getTypeIcon(type)}
                            <span>Array{!isEmpty && ` [${value.length}]`}</span>
                        </div>
                    </div>
                </div>
                {!isEmpty && !collapsed && (
                    <div className="ml-2">
                        {value.map((item: any, index: number) => (
                            <JsonTreeNode
                                key={index}
                                keyName={index.toString()}
                                value={item}
                                level={level + 1}
                            />
                        ))}
                    </div>
                )}
                <div className="font-mono text-sm text-base-content px-2" style={{ marginLeft: `${level * 20}px` }}>
                    <span>{']'}</span>
                </div>
            </div>
        )
    }

    // 基本类型
    return (
        <div className="flex items-center hover:bg-base-200 rounded px-2 py-1 group">
            <div className="flex items-center" style={{ marginLeft: `${level * 20}px` }}>
                {keyName && (
                    <>
                        <span className="text-secondary font-mono text-sm">"{keyName}"</span>
                        <span className="text-base-content mx-1">:</span>
                    </>
                )}
                <span className={`${typeColor} font-mono text-sm`}>
                    {type === 'string' ? `"${value}"` : String(value)}
                </span>
                <div className={`ml-2 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-base-300 ${typeColor}`}>
                    {getTypeIcon(type)}
                    <span>{type}{type === 'string' && ` (${value.length})`}</span>
                </div>
            </div>
        </div>
    )
}

export default function JsonToolPage() {
    const [input, setInput] = useState('')
    const [mode, setMode] = useState<JsonMode>('format')

    // 获取模式配置
    const getModeConfig = (mode: JsonMode) => {
        const configs = {
            format: { icon: Code2, label: '格式化', title: '格式化结果' },
            minify: { icon: Minimize2, label: '压缩', title: '压缩结果' },
            validate: { icon: CheckCircle, label: '验证', title: '验证结果' },
            escape: { icon: Quote, label: '转义', title: '转义结果' },
            'escape-minify': { icon: Quote, label: '转义压缩', title: '转义压缩结果' },
            unescape: { icon: FileX, label: '去转义', title: '去转义结果' },
            visualize: { icon: Eye, label: '可视化', title: 'JSON 可视化' }
        }
        return configs[mode]
    }

    // 处理 JSON 数据
    const processedData = useMemo(() => {
        if (!input.trim()) {
            return { output: '', parsedData: null, error: null }
        }

        try {
            let dataToProcess = input.trim()

            // 智能检测转义字符串
            if (dataToProcess.startsWith('"') && dataToProcess.endsWith('"')) {
                try {
                    const unescaped = JSON.parse(dataToProcess)
                    if (typeof unescaped === 'string') {
                        if (mode === 'format' || mode === 'visualize') {
                            dataToProcess = unescaped
                        }
                    }
                } catch {
                    // 继续使用原始输入
                }
            }

            const parsed = JSON.parse(dataToProcess)
            let output = ''

            switch (mode) {
                case 'format':
                    output = JSON.stringify(parsed, null, 2)
                    break
                case 'minify':
                    output = JSON.stringify(parsed)
                    break
                case 'validate':
                    output = 'JSON 格式正确\n\n' + JSON.stringify(parsed, null, 2)
                    break
                case 'escape':
                    output = JSON.stringify(input)
                    break
                case 'escape-minify':
                    try {
                        const minified = JSON.stringify(JSON.parse(input))
                        output = JSON.stringify(minified)
                    } catch {
                        output = JSON.stringify(input)
                    }
                    break
                case 'unescape':
                    try {
                        const unescaped = JSON.parse(input)
                        if (typeof unescaped === 'string') {
                            try {
                                const reparsed = JSON.parse(unescaped)
                                output = JSON.stringify(reparsed, null, 2)
                            } catch {
                                output = unescaped
                            }
                        } else {
                            output = JSON.stringify(unescaped, null, 2)
                        }
                    } catch {
                        output = '无法去转义：输入不是有效的转义字符串'
                    }
                    break
                case 'visualize':
                    output = 'VISUALIZE_MODE'
                    break
            }

            return { output, parsedData: parsed, error: null }
        } catch (error) {
            if (mode === 'escape' || mode === 'escape-minify') {
                return { output: JSON.stringify(input), parsedData: null, error: null }
            }
            return {
                output: `JSON 格式错误: ${(error as Error).message}`,
                parsedData: null,
                error: error as Error
            }
        }
    }, [input, mode])

    const copyToClipboard = async () => {
        let contentToCopy = processedData.output

        if (mode === 'visualize' && processedData.parsedData) {
            contentToCopy = JSON.stringify(processedData.parsedData, null, 2)
        }

        if (contentToCopy && contentToCopy !== 'VISUALIZE_MODE') {
            try {
                await navigator.clipboard.writeText(contentToCopy)
                toast.success(`已复制到剪贴板 (${contentToCopy.length} 字符)`)
            } catch {
                toast.error('复制失败')
            }
        } else {
            toast.error('没有内容可复制')
        }
    }

    const loadSample = () => {
        const sampleJson = {
            "name": "协议解析器",
            "version": "1.0.0",
            "features": ["JSON处理", "协议解析", "数据转换"],
            "config": {
                "theme": "auto",
                "language": "zh-CN"
            },
            "timestamp": new Date().toISOString()
        }
        setInput(JSON.stringify(sampleJson))
        toast.success('已加载示例数据')
    }

    const loadEscapeSample = () => {
        const escapedJson = '{"data": "{\\"name\\": \\"test\\", \\"value\\": 123}"}'
        setInput(escapedJson)
        setMode('unescape')
        toast.success('已加载转义示例数据')
    }

    const currentModeConfig = getModeConfig(mode)
    const ModeIcon = currentModeConfig.icon

    return (
        <div className="h-full flex flex-col bg-base-100 overflow-hidden">
            {/* Header */}
            <div className="flex-none p-4 border-b border-base-300 bg-base-100">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link to="/tools" className="btn btn-ghost btn-circle">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Braces className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">JSON 处理工具</h1>
                            <p className="text-sm text-base-content/70">
                                JSON 格式化、压缩、验证、转义和可视化
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {[
                            { key: 'format' as JsonMode, icon: Code2, label: '格式化' },
                            { key: 'minify' as JsonMode, icon: Minimize2, label: '压缩' },
                            { key: 'validate' as JsonMode, icon: CheckCircle, label: '验证' },
                            { key: 'escape' as JsonMode, icon: Quote, label: '转义' },
                            { key: 'escape-minify' as JsonMode, icon: Quote, label: '转义压缩' },
                            { key: 'unescape' as JsonMode, icon: FileX, label: '去转义' },
                            { key: 'visualize' as JsonMode, icon: Eye, label: '可视化' }
                        ].map(({ key, icon: Icon, label }) => (
                            <button
                                key={key}
                                className={`btn btn-sm gap-1 ${mode === key ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setMode(key)}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 min-h-0 overflow-hidden">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full">
                    {/* Input Panel */}
                    <div className="flex flex-col bg-base-200 rounded-lg border border-base-300 overflow-hidden">
                        <div className="flex items-center justify-between p-3 border-b border-base-300 bg-base-300/50">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">
                                    {mode === 'escape' ? '输入文本' : mode === 'unescape' ? '输入转义字符串' : '输入 JSON'}
                                </span>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    className="btn btn-xs btn-ghost gap-1"
                                    onClick={loadSample}
                                    title="加载示例数据"
                                >
                                    <FileText className="w-3 h-3" />
                                    示例
                                </button>
                                {mode === 'unescape' && (
                                    <button
                                        className="btn btn-xs btn-ghost gap-1"
                                        onClick={loadEscapeSample}
                                        title="加载转义示例"
                                    >
                                        <Quote className="w-3 h-3" />
                                        转义示例
                                    </button>
                                )}
                                <button
                                    className="btn btn-xs btn-ghost gap-1"
                                    onClick={() => setInput('')}
                                    title="清空输入"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    清空
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 relative">
                            <textarea
                                className="absolute inset-0 w-full h-full p-4 bg-transparent font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-inset"
                                placeholder={
                                    mode === 'escape'
                                        ? '请输入要转义的文本...\n\n示例:\n{\n  "name": "test",\n  "value": 123\n}'
                                        : mode === 'unescape'
                                            ? '请输入转义的字符串...\n\n示例:\n"{\\"name\\": \\"test\\", \\"value\\": 123}"'
                                            : '请输入 JSON 内容...\n\n示例:\n{\n  "name": "示例",\n  "value": 123,\n  "array": [1, 2, 3]\n}'
                                }
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                spellCheck={false}
                            />
                        </div>
                        <div className="flex-none px-4 py-2 bg-base-300/50 text-xs text-base-content/60 border-t border-base-300">
                            <div className="flex items-center gap-4">
                                <span>字符数: {input.length}</span>
                                <span>行数: {input.split('\n').length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Output Panel */}
                    <div className="flex flex-col bg-base-200 rounded-lg border border-base-300 overflow-hidden">
                        <div className="flex items-center justify-between p-3 border-b border-base-300 bg-base-300/50">
                            <div className="flex items-center gap-2">
                                <ModeIcon className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">{currentModeConfig.title}</span>
                                {processedData.error && (
                                    <div className="flex items-center gap-1 text-error">
                                        <AlertCircle className="w-3 h-3" />
                                        <span className="text-xs">错误</span>
                                    </div>
                                )}
                                {!processedData.error && processedData.output && processedData.output.startsWith('JSON 格式正确') && (
                                    <div className="flex items-center gap-1 text-success">
                                        <CheckCircle className="w-3 h-3" />
                                        <span className="text-xs">正确</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <button
                                    className="btn btn-xs btn-ghost gap-1"
                                    onClick={copyToClipboard}
                                    disabled={!processedData.output || processedData.output === 'VISUALIZE_MODE'}
                                    title="复制到剪贴板"
                                >
                                    <Copy className="w-3 h-3" />
                                    复制
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 relative overflow-hidden">
                            {mode === 'visualize' ? (
                                processedData.parsedData ? (
                                    <div className="absolute inset-0 overflow-auto p-4">
                                        <JsonTreeNode value={processedData.parsedData} />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center p-8">
                                            <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
                                            <p className="text-error font-medium">JSON 格式错误</p>
                                            <p className="text-sm text-base-content/60 mt-1">无法解析输入的 JSON 数据</p>
                                        </div>
                                    </div>
                                )
                            ) : (mode === 'format' || mode === 'validate') && !processedData.error ? (
                                <div className="absolute inset-0 overflow-auto p-4">
                                    <JsonSyntaxHighlight
                                        json={processedData.output}
                                        className={processedData.output.startsWith('JSON 格式正确') ? 'text-success' : ''}
                                    />
                                </div>
                            ) : (
                                <textarea
                                    className={`absolute inset-0 w-full h-full p-4 bg-transparent font-mono text-sm resize-none focus:outline-none ${processedData.error ? 'text-error' :
                                        processedData.output.startsWith('JSON 格式正确') ? 'text-success' : ''
                                        }`}
                                    placeholder="实时处理结果将显示在这里..."
                                    value={processedData.output}
                                    readOnly
                                    spellCheck={false}
                                />
                            )}
                        </div>
                        <div className="flex-none px-4 py-2 bg-base-300/50 text-xs text-base-content/60 border-t border-base-300">
                            {mode === 'visualize' && processedData.parsedData ? (
                                <div className="flex items-center gap-4">
                                    <span>节点数: {JSON.stringify(processedData.parsedData).length} 字符</span>
                                    <span>
                                        类型: {Array.isArray(processedData.parsedData)
                                            ? `Array[${processedData.parsedData.length}]`
                                            : typeof processedData.parsedData === 'object'
                                                ? `Object{${Object.keys(processedData.parsedData).length}}`
                                                : typeof processedData.parsedData}
                                    </span>
                                </div>
                            ) : processedData.output ? (
                                <div className="flex items-center gap-4">
                                    <span>字符数: {processedData.output.length}</span>
                                    <span>行数: {processedData.output.split('\n').length}</span>
                                    {mode === 'minify' && input && !processedData.output.startsWith('JSON 格式错误') && (
                                        <span>
                                            压缩率: {((1 - processedData.output.length / input.length) * 100).toFixed(1)}%
                                        </span>
                                    )}
                                    {(mode === 'escape' || mode === 'escape-minify') && input && !processedData.output.startsWith('JSON 格式错误') && (
                                        <span>
                                            转义后增长: {((processedData.output.length / input.length - 1) * 100).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}