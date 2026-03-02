import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface ProtocolTemplate {
  id: string
  name: string
  description: string
  fields: Array<{
    name: string
    label: string
    type: 'text' | 'number' | 'select' | 'hex'
    options?: string[]
    default?: string
    length?: number
    required?: boolean
  }>
}

const protocolTemplates: ProtocolTemplate[] = [
  {
    id: 'csg13',
    name: 'CSG13 协议',
    description: '南方电网 CSG13 协议报文生成',
    fields: [
      { name: 'address', label: '地址域', type: 'hex', length: 12, required: true, default: '000000000000' },
      { name: 'control', label: '控制域', type: 'select', options: ['68', '88', 'A8'], required: true, default: '68' },
      { name: 'dataId', label: '数据标识', type: 'hex', length: 4, required: true, default: '0000' },
      { name: 'data', label: '数据域', type: 'hex', default: '' }
    ]
  },
  {
    id: 'dlt645',
    name: 'DLT/645-2007',
    description: '电力行业标准 DL/T 645-2007 协议',
    fields: [
      { name: 'address', label: '地址域', type: 'hex', length: 12, required: true, default: '000000000000' },
      { name: 'control', label: '控制码', type: 'select', options: ['11', '91', '14', '94'], required: true, default: '11' },
      { name: 'dataId', label: '数据标识', type: 'hex', length: 8, required: true, default: '00000000' },
      { name: 'data', label: '数据域', type: 'hex', default: '' }
    ]
  }
]

export default function GeneratorPage() {
  const [selectedProtocol, setSelectedProtocol] = useState<string>('')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [generatedFrame, setGeneratedFrame] = useState('')

  const currentTemplate = protocolTemplates.find(t => t.id === selectedProtocol)

  const handleProtocolChange = (protocolId: string) => {
    setSelectedProtocol(protocolId)
    const template = protocolTemplates.find(t => t.id === protocolId)
    if (template) {
      const initialData: Record<string, string> = {}
      template.fields.forEach(field => {
        initialData[field.name] = field.default || ''
      })
      setFormData(initialData)
    }
    setGeneratedFrame('')
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const calculateChecksum = (data: string): string => {
    // 简单的校验和计算 (实际应根据协议规范)
    let sum = 0
    for (let i = 0; i < data.length; i += 2) {
      const byte = parseInt(data.substr(i, 2), 16)
      if (!isNaN(byte)) {
        sum += byte
      }
    }
    return (sum & 0xFF).toString(16).padStart(2, '0').toUpperCase()
  }

  const generateFrame = () => {
    if (!currentTemplate) {
      toast.error('请选择协议类型')
      return
    }

    try {
      // 验证必填字段
      for (const field of currentTemplate.fields) {
        if (field.required && !formData[field.name]) {
          toast.error(`${field.label} 为必填项`)
          return
        }
      }

      let frame = ''
      
      if (selectedProtocol === 'csg13') {
        // CSG13 协议格式: 68 + 地址域 + 68 + 控制域 + 长度 + 数据标识 + 数据域 + 校验和 + 16
        const address = formData.address.padEnd(12, '0')
        const control = formData.control
        const dataId = formData.dataId.padEnd(4, '0')
        const data = formData.data || ''
        const length = ((dataId.length + data.length) / 2).toString(16).padStart(2, '0').toUpperCase()
        
        const frameWithoutChecksum = `68${address}68${control}${length}${dataId}${data}`
        const checksum = calculateChecksum(frameWithoutChecksum)
        frame = `${frameWithoutChecksum}${checksum}16`
        
      } else if (selectedProtocol === 'dlt645') {
        // DLT645 协议格式: 68 + 地址域 + 68 + 控制码 + 长度 + 数据标识 + 数据域 + 校验和 + 16
        const address = formData.address.padEnd(12, '0')
        const control = formData.control
        const dataId = formData.dataId.padEnd(8, '0')
        const data = formData.data || ''
        const length = ((dataId.length + data.length) / 2).toString(16).padStart(2, '0').toUpperCase()
        
        const frameWithoutChecksum = `68${address}68${control}${length}${dataId}${data}`
        const checksum = calculateChecksum(frameWithoutChecksum)
        frame = `${frameWithoutChecksum}${checksum}16`
      }

      // 格式化输出 (每两个字符加一个空格)
      const formattedFrame = frame.replace(/(.{2})/g, '$1 ').trim()
      setGeneratedFrame(formattedFrame)
      toast.success('报文生成成功')
      
    } catch (error) {
      toast.error('生成失败: ' + (error as Error).message)
    }
  }

  const copyToClipboard = () => {
    if (generatedFrame) {
      navigator.clipboard.writeText(generatedFrame)
      toast.success('已复制到剪贴板')
    }
  }

  const clearForm = () => {
    if (currentTemplate) {
      const initialData: Record<string, string> = {}
      currentTemplate.fields.forEach(field => {
        initialData[field.name] = field.default || ''
      })
      setFormData(initialData)
    }
    setGeneratedFrame('')
    toast.success('表单已清空')
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 p-6 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">报文生成器</h1>
            <p className="text-sm text-base-content/70 mt-1">
              生成标准协议报文
            </p>
          </div>
          <div className="badge badge-warning">开发中</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Protocol Selection */}
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body">
              <h2 className="card-title">选择协议类型</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {protocolTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`card cursor-pointer transition-all duration-200 ${
                      selectedProtocol === template.id
                        ? 'bg-primary text-primary-content shadow-lg'
                        : 'bg-base-200 hover:bg-base-300'
                    }`}
                    onClick={() => handleProtocolChange(template.id)}
                  >
                    <div className="card-body p-4">
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm opacity-80">{template.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          {currentTemplate && (
            <div className="card bg-base-100 shadow-lg border border-base-300">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="card-title">配置参数</h2>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={clearForm}
                  >
                    重置
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentTemplate.fields.map((field) => (
                    <div key={field.name} className="form-control">
                      <label className="label">
                        <span className="label-text">
                          {field.label}
                          {field.required && <span className="text-error ml-1">*</span>}
                        </span>
                        {field.length && (
                          <span className="label-text-alt">长度: {field.length}</span>
                        )}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          className="select select-bordered"
                          value={formData[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        >
                          <option value="">请选择...</option>
                          {field.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className={`input input-bordered ${field.type === 'hex' ? 'font-mono' : ''}`}
                          placeholder={field.type === 'hex' ? '请输入十六进制...' : `请输入${field.label}...`}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          maxLength={field.length}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="card-actions justify-center mt-6">
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={generateFrame}
                  >
                    生成报文
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generated Frame */}
          {generatedFrame && (
            <div className="card bg-base-100 shadow-lg border border-base-300">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="card-title">生成的报文</h2>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={copyToClipboard}
                  >
                    复制
                  </button>
                </div>
                <div className="mockup-code">
                  <pre className="text-sm"><code>{generatedFrame}</code></pre>
                </div>
                <div className="stats stats-horizontal shadow mt-4">
                  <div className="stat">
                    <div className="stat-title">报文长度</div>
                    <div className="stat-value text-lg">{generatedFrame.replace(/\s/g, '').length / 2} 字节</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">十六进制长度</div>
                    <div className="stat-value text-lg">{generatedFrame.replace(/\s/g, '').length} 字符</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Help */}
          <div className="card bg-info/10 border border-info/20">
            <div className="card-body">
              <h3 className="font-semibold text-info">使用说明</h3>
              <ul className="text-sm space-y-1 text-info/80">
                <li>• 选择对应的协议类型</li>
                <li>• 填写必要的参数字段</li>
                <li>• 十六进制字段请输入有效的十六进制字符</li>
                <li>• 系统会自动计算校验和并添加帧头帧尾</li>
                <li>• 生成的报文可直接用于协议测试</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}