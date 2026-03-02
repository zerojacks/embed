import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft,
  Calculator,
  Copy,
  Trash2,
  Hash,
  Binary,
  Type,
  CheckCircle
} from 'lucide-react'

type ConversionType = 'hex' | 'dec' | 'bin' | 'ascii'

export default function ConverterPage() {
  const [input, setInput] = useState('')
  const [inputType, setInputType] = useState<ConversionType>('hex')

  const convertValue = (value: string, fromType: ConversionType) => {
    if (!value.trim()) return { hex: '', dec: '', bin: '', ascii: '' }

    try {
      let result = { hex: '', dec: '', bin: '', ascii: '' }

      switch (fromType) {
        case 'hex':
          const hexClean = value.replace(/[^0-9A-Fa-f]/g, '')
          if (hexClean) {
            // 如果长度是奇数，前面补0
            const paddedHex = hexClean.length % 2 === 1 ? '0' + hexClean : hexClean

            // 十六进制转ASCII（按字节对处理）
            try {
              const asciiResult = []

              for (let i = 0; i < paddedHex.length; i += 2) {
                const byte = paddedHex.substr(i, 2)
                const charCode = parseInt(byte, 16)
                if (charCode >= 32 && charCode <= 126) {
                  // 可打印ASCII字符
                  asciiResult.push(String.fromCharCode(charCode))
                } else {
                  // 不可打印字符显示为 [十进制值] 格式
                  asciiResult.push(`[${charCode}]`)
                }
              }
              result.ascii = asciiResult.join('')
            } catch {
              result.ascii = '无法转换'
            }

            // 设置十六进制结果
            result.hex = paddedHex.toUpperCase()

            // 十六进制转十进制和二进制（作为整数处理）
            try {
              const decimalValue = parseInt(paddedHex, 16)
              if (!isNaN(decimalValue)) {
                result.dec = decimalValue.toString(10)
                result.bin = decimalValue.toString(2)
              }
            } catch {
              // 如果数值太大，保持为空
            }
          }
          break

        case 'dec':
          const decClean = value.replace(/[^0-9]/g, '')
          if (decClean) {
            const decimalValue = parseInt(decClean, 10)
            if (!isNaN(decimalValue) && decimalValue >= 0 && decimalValue <= 255) {
              result.hex = decimalValue.toString(16).toUpperCase().padStart(2, '0')
              result.dec = decimalValue.toString(10)
              result.bin = decimalValue.toString(2)
              // 转ASCII
              if (decimalValue >= 32 && decimalValue <= 126) {
                result.ascii = String.fromCharCode(decimalValue)
              } else {
                result.ascii = `\\x${result.hex}`
              }
            } else if (!isNaN(decimalValue)) {
              // 大于255的数值
              result.hex = decimalValue.toString(16).toUpperCase()
              result.dec = decimalValue.toString(10)
              result.bin = decimalValue.toString(2)
            }
          }
          break

        case 'bin':
          const binClean = value.replace(/[^01]/g, '')
          if (binClean) {
            const decimalValue = parseInt(binClean, 2)
            if (!isNaN(decimalValue)) {
              result.hex = decimalValue.toString(16).toUpperCase()
              result.dec = decimalValue.toString(10)
              result.bin = decimalValue.toString(2)
              // 如果在ASCII范围内
              if (decimalValue >= 32 && decimalValue <= 126) {
                result.ascii = String.fromCharCode(decimalValue)
              } else if (decimalValue <= 255) {
                result.ascii = `\\x${decimalValue.toString(16).toUpperCase().padStart(2, '0')}`
              }
            }
          }
          break

        case 'ascii':
          try {
            const hexBytes = []
            for (let i = 0; i < value.length; i++) {
              const charCode = value.charCodeAt(i)
              hexBytes.push(charCode.toString(16).toUpperCase().padStart(2, '0'))
            }
            result.hex = hexBytes.join('')
            result.ascii = value

            // 如果是单个字符，也计算其他进制
            if (value.length === 1) {
              const charCode = value.charCodeAt(0)
              result.dec = charCode.toString(10)
              result.bin = charCode.toString(2)
            }
          } catch {
            result.ascii = '转换失败'
          }
          break
      }

      return result
    } catch {
      return { hex: '', dec: '', bin: '', ascii: '' }
    }
  }

  const result = convertValue(input, inputType)

  const copyToClipboard = async (text: string, type: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${type} 已复制`)
    } catch {
      toast.error('复制失败')
    }
  }

  return (
    <div className="h-full flex flex-col bg-base-100">
      {/* Header */}
      <div className="flex-none p-4 border-b border-base-300">
        <div className="flex items-center gap-4">
          <Link to="/tools" className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">进制转换器</h1>
              <p className="text-sm text-base-content/70">支持十六进制、十进制、二进制、ASCII 互转</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Input Section */}
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">输入数据</h2>

              {/* Type Selector */}
              <div className="tabs tabs-boxed mb-4">
                <button
                  className={`tab gap-2 ${inputType === 'hex' ? 'tab-active' : ''}`}
                  onClick={() => setInputType('hex')}
                >
                  <Hash className="w-4 h-4" />
                  十六进制
                </button>
                <button
                  className={`tab gap-2 ${inputType === 'dec' ? 'tab-active' : ''}`}
                  onClick={() => setInputType('dec')}
                >
                  <Calculator className="w-4 h-4" />
                  十进制
                </button>
                <button
                  className={`tab gap-2 ${inputType === 'bin' ? 'tab-active' : ''}`}
                  onClick={() => setInputType('bin')}
                >
                  <Binary className="w-4 h-4" />
                  二进制
                </button>
                <button
                  className={`tab gap-2 ${inputType === 'ascii' ? 'tab-active' : ''}`}
                  onClick={() => setInputType('ascii')}
                >
                  <Type className="w-4 h-4" />
                  ASCII
                </button>
              </div>

              {/* Input Field */}
              <textarea
                className="textarea textarea-bordered w-full h-24 font-mono"
                placeholder={
                  inputType === 'hex' ? '例如: FF, 48656C6C6F' :
                    inputType === 'dec' ? '例如: 255, 72' :
                      inputType === 'bin' ? '例如: 11111111, 1001000' :
                        '例如: Hello, A'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />

              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-base-content/60">{input.length} 字符</span>
                <button
                  className="btn btn-ghost btn-sm gap-2"
                  onClick={() => setInput('')}
                >
                  <Trash2 className="w-4 h-4" />
                  清空
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">转换结果</h2>

              {/* All Results Display */}
              <div className="space-y-4">
                {/* HEX Result */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <Hash className="w-4 h-4 text-primary" />
                      十六进制 (HEX)
                    </span>
                    <button
                      className="btn btn-primary btn-sm gap-1"
                      onClick={() => copyToClipboard(result.hex, '十六进制')}
                      disabled={!result.hex}
                    >
                      <Copy className="w-3 h-3" />
                      复制
                    </button>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full font-mono"
                    value={result.hex}
                    readOnly
                    placeholder="HEX 结果"
                  />
                </div>

                {/* DEC Result */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-secondary" />
                      十进制 (DEC)
                    </span>
                    <button
                      className="btn btn-secondary btn-sm gap-1"
                      onClick={() => copyToClipboard(result.dec, '十进制')}
                      disabled={!result.dec}
                    >
                      <Copy className="w-3 h-3" />
                      复制
                    </button>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full font-mono"
                    value={result.dec}
                    readOnly
                    placeholder="DEC 结果"
                  />
                </div>

                {/* BIN Result */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <Binary className="w-4 h-4 text-accent" />
                      二进制 (BIN)
                    </span>
                    <button
                      className="btn btn-accent btn-sm gap-1"
                      onClick={() => copyToClipboard(result.bin, '二进制')}
                      disabled={!result.bin}
                    >
                      <Copy className="w-3 h-3" />
                      复制
                    </button>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full font-mono text-sm"
                    value={result.bin}
                    readOnly
                    placeholder="BIN 结果"
                    rows={3}
                  />
                </div>

                {/* ASCII Result */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <Type className="w-4 h-4 text-info" />
                      ASCII 文本
                    </span>
                    <button
                      className="btn btn-info btn-sm gap-1"
                      onClick={() => copyToClipboard(result.ascii, 'ASCII')}
                      disabled={!result.ascii}
                    >
                      <Copy className="w-3 h-3" />
                      复制
                    </button>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full font-mono"
                    value={result.ascii}
                    readOnly
                    placeholder="ASCII 结果"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {result.hex && (
            <div className="alert alert-success">
              <CheckCircle className="w-5 h-5" />
              <span>转换成功！点击复制按钮可以复制结果</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}