import React, { useState, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { FileText, Upload, X } from 'lucide-react'

interface ProtocolConfigUploaderProps {
    onConfigUploaded: (protocolType: string, content: string, fileName?: string) => void
}

const PROTOCOL_TYPES = [
    { key: 'CSG13', name: 'CSG13 协议' },
    { key: 'DLT645', name: 'DLT645 协议' },
    { key: 'CSG16', name: 'CSG16 协议' },
    { key: 'MOUDLE', name: 'MOUDLE 协议' },
    { key: 'TASK_MS', name: 'TASK_MS 协议' }
]

const ProtocolConfigUploader: React.FC<ProtocolConfigUploaderProps> = ({
    onConfigUploaded
}) => {
    const [selectedProtocol, setSelectedProtocol] = useState<string>('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
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

            setSelectedFile(file)
        }
    }

    const handleUpload = async () => {
        if (!selectedProtocol) {
            toast.error('请选择协议类型')
            return
        }

        if (!selectedFile) {
            toast.error('请选择配置文件')
            return
        }

        setIsUploading(true)

        try {
            // 读取文件内容
            const content = await readFileContent(selectedFile)

            // 简单验证 XML 格式
            if (!isValidXml(content)) {
                toast.error('无效的 XML 文件格式')
                return
            }

            // 调用回调函数，传递文件名
            onConfigUploaded(selectedProtocol, content, selectedFile.name)

            // 重置状态
            setSelectedFile(null)
            setSelectedProtocol('')
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }

            toast.success(`${selectedProtocol} 协议配置上传成功`)
        } catch (error) {
            console.error('Upload failed:', error)
            toast.error('配置上传失败')
        } finally {
            setIsUploading(false)
        }
    }

    const readFileContent = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.onerror = (e) => reject(e)
            reader.readAsText(file, 'UTF-8')
        })
    }

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

    const clearSelection = () => {
        setSelectedFile(null)
        setSelectedProtocol('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title">协议配置上传</h2>

                <div className="space-y-4">
                    {/* 协议类型选择 */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">选择协议类型</span>
                        </label>
                        <select
                            className="select select-bordered"
                            value={selectedProtocol}
                            onChange={(e) => setSelectedProtocol(e.target.value)}
                            disabled={isUploading}
                        >
                            <option value="">请选择协议类型</option>
                            {PROTOCOL_TYPES.map((protocol) => (
                                <option key={protocol.key} value={protocol.key}>
                                    {protocol.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 文件选择 */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">选择配置文件</span>
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xml"
                            onChange={handleFileSelect}
                            className="file-input file-input-bordered"
                            disabled={isUploading}
                        />
                        <label className="label">
                            <span className="label-text-alt">仅支持 XML 格式，最大 5MB</span>
                        </label>
                    </div>

                    {/* 选择的文件信息 */}
                    {selectedFile && (
                        <div className="alert alert-info">
                            <div className="flex items-center space-x-2">
                                <FileText className="w-5 h-5" />
                                <div>
                                    <div className="font-medium">{selectedFile.name}</div>
                                    <div className="text-sm opacity-70">
                                        {(selectedFile.size / 1024).toFixed(1)} KB
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="card-actions justify-end">
                        <button
                            className="btn btn-ghost"
                            onClick={clearSelection}
                            disabled={isUploading}
                        >
                            <X className="w-4 h-4" />
                            清空
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleUpload}
                            disabled={!selectedProtocol || !selectedFile || isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    上传中...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    上传配置
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProtocolConfigUploader