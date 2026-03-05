import { useState, useCallback } from 'react'
import type { ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Calculator, Copy, CheckCircle, AlertCircle, Info, Edit, Target } from 'lucide-react'
import { useWasm } from '../../contexts/WasmContext'

type ConversionMode = 'point_to_da' | 'da_to_point'
type DisplayMode = 'continuous' | 'single'

export default function MeasurementPointsPage() {
    const [input, setInput] = useState('')
    const [result, setResult] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<ConversionMode>('point_to_da')
    const [displayMode, setDisplayMode] = useState<DisplayMode>('continuous')
    const [copied, setCopied] = useState(false)

    const { DaPointExchange } = useWasm()

    const handleConvert = useCallback(async (currentInput: string, currentMode: ConversionMode, currentDisplayMode: DisplayMode) => {
        if (!currentInput.trim()) {
            setError('请输入需要转换的数据')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const result = await DaPointExchange(
                currentInput.trim(),
                currentMode,
                currentDisplayMode === 'continuous'
            )
            setResult(result)
        } catch (err) {
            setError((err as Error).message)
            setResult(null)
        } finally {
            setLoading(false)
        }
    }, [DaPointExchange])

    const handleModeChange = (newMode: ConversionMode) => {
        setMode(newMode)
        setResult(null)
        setError(null)
        setInput('')
    }

    const handleDisplayModeChange = (newDisplayMode: DisplayMode) => {
        setDisplayMode(newDisplayMode)
        if (input.trim() && mode === 'point_to_da') {
            handleConvert(input, mode, newDisplayMode)
        }
    }

    const copyToClipboard = async (text: string) => {
        if (!text) return
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            toast.success('已复制到剪贴板')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error('复制失败')
        }
    }

    const getPlaceholder = (): string => {
        if (mode === 'point_to_da') {
            return '请输入测量点，支持以下格式：\n' +
                '单个测量点：1,2,3,4\n' +
                '连续测量点：1-10,13,15,17-20\n' +
                '多个测量点：1,2,3,4,5,6,7,8,99'
        } else {
            return '请输入DA值，支持以下格式：\n' +
                '单个DA：0x1234 或 1234\n' +
                '连续DA：0x1234-0x1240 或 1234-1240\n' +
                '多个DA：0x1234,0x1235 或 1234,1235'
        }
    }

    const examples = [
        {
            name: '单个测量点',
            data: '1,2,3,4',
            desc: '转换为对应的DA值',
            mode: 'point_to_da' as ConversionMode
        },
        {
            name: '连续测量点',
            data: '1-10,13,15',
            desc: '支持范围和单点混合',
            mode: 'point_to_da' as ConversionMode
        },
        {
            name: '单个DA值',
            data: '0x4001,0x4002',
            desc: '转换为测量点',
            mode: 'da_to_point' as ConversionMode
        },
        {
            name: 'DA范围',
            data: '0x4001-0x4010',
            desc: '连续DA值转换',
            mode: 'da_to_point' as ConversionMode
        }
    ]

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="shrink-0 p-4 border-b border-base-300">
                <div className="flex items-center gap-4">
                    <Link to="/tools" className="btn btn-ghost btn-circle">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <Calculator className="w-6 h-6 text-primary" />
                        <div>
                            <h1 className="text-xl font-bold">测量点转换器</h1>
                            <p className="text-sm text-base-content/70">测量点与DA值相互转换</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 overflow-auto">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Input Section */}
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title text-lg mb-4">
                                    <Edit className="w-5 h-5" />
                                    数据输入
                                </h2>

                                {/* 转换模式选择 */}
                                <div className="form-control mb-4">
                                    <label className="label">
                                        <span className="label-text font-medium">转换模式</span>
                                    </label>
                                    <div className="tabs tabs-boxed">
                                        <button
                                            className={`tab tab-sm ${mode === 'point_to_da' ? 'tab-active' : ''}`}
                                            onClick={() => handleModeChange('point_to_da')}
                                        >
                                            测量点转DA
                                        </button>
                                        <button
                                            className={`tab tab-sm ${mode === 'da_to_point' ? 'tab-active' : ''}`}
                                            onClick={() => handleModeChange('da_to_point')}
                                        >
                                            DA转测量点
                                        </button>
                                    </div>
                                </div>

                                {/* 显示模式选择 */}
                                {mode === 'point_to_da' && (
                                    <div className="form-control mb-4">
                                        <label className="label">
                                            <span className="label-text font-medium">显示模式</span>
                                        </label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    className="radio radio-primary radio-sm"
                                                    checked={displayMode === 'continuous'}
                                                    onChange={() => handleDisplayModeChange('continuous')}
                                                />
                                                <span className="text-sm">整合显示</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    className="radio radio-primary radio-sm"
                                                    checked={displayMode === 'single'}
                                                    onChange={() => handleDisplayModeChange('single')}
                                                />
                                                <span className="text-sm">单点显示</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            {mode === 'point_to_da' ? '测量点数据' : 'DA值数据'}
                                        </span>
                                        <span className="label-text-alt">支持多种格式</span>
                                    </label>
                                    <textarea
                                        className="textarea textarea-bordered h-24 font-mono"
                                        placeholder={getPlaceholder()}
                                        value={input}
                                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                                    />
                                </div>

                                <div className="card-actions justify-between mt-4">
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => setInput('')}
                                    >
                                        清空
                                    </button>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleConvert(input, mode, displayMode)}
                                        disabled={loading}
                                    >
                                        {loading ? '转换中...' : '转换'}
                                    </button>
                                </div>

                                {/* Algorithm Description */}
                                <div className="alert alert-info mt-4">
                                    <Info className="w-6 h-6 shrink-0" />
                                    <div className="text-sm">
                                        <div className="font-bold">
                                            {mode === 'point_to_da' ? '测量点转DA值' : 'DA值转测量点'}
                                        </div>
                                        <div className="text-xs mt-2 space-y-1">
                                            {mode === 'point_to_da' ? (
                                                <>
                                                    <div>支持单个测量点：1,2,3,4</div>
                                                    <div>支持连续范围：1-10,13,15,17-20</div>
                                                    <div>整合显示：合并连续的DA值</div>
                                                    <div>单点显示：每个测量点单独显示</div>
                                                </>
                                            ) : (
                                                <>
                                                    <div>支持十六进制：0x4001,0x4002</div>
                                                    <div>支持十进制：16385,16386</div>
                                                    <div>支持范围：0x4001-0x4010</div>
                                                    <div>自动识别格式并转换为测量点</div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Result Section */}
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title text-lg mb-4">
                                    <Target className="w-5 h-5" />
                                    转换结果
                                </h2>

                                {/* 结果显示 */}
                                {result && (
                                    <div className="form-control mb-4">
                                        <label className="label">
                                            <span className="label-text font-semibold">
                                                {mode === 'point_to_da'
                                                    ? `DA值列表 (${displayMode === 'continuous' ? '整合显示' : '单点显示'})`
                                                    : '测量点列表'
                                                }
                                            </span>
                                        </label>
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1 p-3 rounded-lg border-2 border-success bg-success/10 text-success font-mono text-sm max-h-48 overflow-auto">
                                                <div className="space-y-1">
                                                    {result.split(',').map((item, index) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            <span className="text-base-content/50 text-xs">{index + 1}.</span>
                                                            <span>{item.trim()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-outline btn-square"
                                                onClick={() => copyToClipboard(result)}
                                                title="复制结果"
                                            >
                                                {copied ? (
                                                    <CheckCircle className="w-4 h-4 text-success" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 无结果时的占位 */}
                                {!result && !error && (
                                    <div className="form-control mb-4">
                                        <label className="label">
                                            <span className="label-text font-semibold">转换结果</span>
                                        </label>
                                        <div className="p-3 rounded-lg border-2 border-base-300 bg-base-200 text-base-content/50 font-mono text-sm min-h-12 flex items-center">
                                            转换结果将显示在这里
                                        </div>
                                    </div>
                                )}

                                {result && (
                                    <div className="alert alert-success mt-4">
                                        <CheckCircle className="w-6 h-6 shrink-0" />
                                        <div>
                                            <h3 className="font-bold">转换完成!</h3>
                                            <div className="text-xs">
                                                共转换了 {result.split(',').length} 个项目
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="alert alert-error mt-4">
                                        <AlertCircle className="w-6 h-6 shrink-0" />
                                        <div>
                                            <h3 className="font-bold">转换失败</h3>
                                            <div className="text-xs">{error}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Data Statistics */}
                                {input && !error && (
                                    <div className="stats shadow mt-4">
                                        <div className="stat py-2">
                                            <div className="stat-title text-xs">输入长度</div>
                                            <div className="stat-value text-sm">
                                                {input.length} 字符
                                            </div>
                                            <div className="stat-desc text-xs">
                                                {mode === 'point_to_da' ? '测量点数据' : 'DA值数据'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Examples */}
                    <div className="mt-6">
                        <h2 className="text-lg font-semibold mb-4">示例数据</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {examples.map((example, index) => (
                                <div key={index} className="card bg-base-100 shadow-sm border border-base-300">
                                    <div className="card-body p-4">
                                        <h3 className="font-semibold text-sm mb-2">{example.name}</h3>
                                        <div className="font-mono text-xs bg-base-200 p-2 rounded mb-2">
                                            {example.data}
                                        </div>
                                        <p className="text-xs text-base-content/70 mb-2">{example.desc}</p>
                                        <button
                                            className="btn btn-xs btn-outline w-full"
                                            onClick={() => {
                                                if (mode !== example.mode) {
                                                    handleModeChange(example.mode)
                                                }
                                                setInput(example.data)
                                            }}
                                        >
                                            使用此例
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 