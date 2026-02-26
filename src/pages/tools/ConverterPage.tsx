import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ConverterPage() {
  const [input, setInput] = useState('')
  const [inputType, setInputType] = useState<'hex' | 'dec' | 'bin'>('hex')

  const convertValue = (value: string, fromType: 'hex' | 'dec' | 'bin') => {
    if (!value.trim()) return { hex: '', dec: '', bin: '' }

    try {
      let decimalValue: number

      switch (fromType) {
        case 'hex':
          decimalValue = parseInt(value.replace(/[^0-9A-Fa-f]/g, ''), 16)
          break
        case 'dec':
          decimalValue = parseInt(value.replace(/[^0-9]/g, ''), 10)
          break
        case 'bin':
          decimalValue = parseInt(value.replace(/[^01]/g, ''), 2)
          break
        default:
          return { hex: '', dec: '', bin: '' }
      }

      if (isNaN(decimalValue)) {
        return { hex: '', dec: '', bin: '' }
      }

      return {
        hex: decimalValue.toString(16).toUpperCase(),
        dec: decimalValue.toString(10),
        bin: decimalValue.toString(2)
      }
    } catch {
      return { hex: '', dec: '', bin: '' }
    }
  }

  const result = convertValue(input, inputType)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const examples = [
    { hex: 'FF', dec: '255', bin: '11111111', desc: '最大单字节' },
    { hex: '100', dec: '256', bin: '100000000', desc: '256' },
    { hex: 'FFFF', dec: '65535', bin: '1111111111111111', desc: '最大双字节' },
    { hex: '1000', dec: '4096', bin: '1000000000000', desc: '4K' }
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-base-300 bg-base-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/tools" className="btn btn-ghost btn-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold">进制转换器</h1>
              <p className="text-sm text-base-content/70">十六进制、十进制、二进制转换</p>
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  输入
                </h2>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-medium">输入类型</span>
                  </label>
                  <div className="tabs tabs-boxed">
                    <button
                      className={`tab ${inputType === 'hex' ? 'tab-active' : ''}`}
                      onClick={() => setInputType('hex')}
                    >
                      十六进制
                    </button>
                    <button
                      className={`tab ${inputType === 'dec' ? 'tab-active' : ''}`}
                      onClick={() => setInputType('dec')}
                    >
                      十进制
                    </button>
                    <button
                      className={`tab ${inputType === 'bin' ? 'tab-active' : ''}`}
                      onClick={() => setInputType('bin')}
                    >
                      二进制
                    </button>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">
                      {inputType === 'hex' && '十六进制值 (0-9, A-F)'}
                      {inputType === 'dec' && '十进制值 (0-9)'}
                      {inputType === 'bin' && '二进制值 (0-1)'}
                    </span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24 font-mono"
                    placeholder={
                      inputType === 'hex' ? '例如: FF, 1A2B' :
                      inputType === 'dec' ? '例如: 255, 6699' :
                      '例如: 11111111, 1101010101011'
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                </div>

                <div className="card-actions justify-end mt-4">
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => setInput('')}
                  >
                    清空
                  </button>
                </div>
              </div>
            </div>

            {/* Output Section */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  转换结果
                </h2>

                <div className="space-y-4">
                  {/* 十六进制结果 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">十六进制 (HEX)</span>
                    </label>
                    <div className="join">
                      <input
                        type="text"
                        className="input input-bordered join-item flex-1 font-mono"
                        value={result.hex}
                        readOnly
                        placeholder="转换结果"
                      />
                      <button
                        className="btn btn-outline join-item"
                        onClick={() => copyToClipboard(result.hex)}
                        disabled={!result.hex}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 十进制结果 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">十进制 (DEC)</span>
                    </label>
                    <div className="join">
                      <input
                        type="text"
                        className="input input-bordered join-item flex-1 font-mono"
                        value={result.dec}
                        readOnly
                        placeholder="转换结果"
                      />
                      <button
                        className="btn btn-outline join-item"
                        onClick={() => copyToClipboard(result.dec)}
                        disabled={!result.dec}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 二进制结果 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">二进制 (BIN)</span>
                    </label>
                    <div className="join">
                      <textarea
                        className="textarea textarea-bordered join-item flex-1 font-mono text-sm"
                        value={result.bin}
                        readOnly
                        placeholder="转换结果"
                        rows={2}
                      />
                      <button
                        className="btn btn-outline join-item"
                        onClick={() => copyToClipboard(result.bin)}
                        disabled={!result.bin}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {result.dec && (
                  <div className="alert alert-success mt-4">
                    <svg className="w-6 h-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                      <h3 className="font-bold">转换成功!</h3>
                      <div className="text-xs">点击复制按钮可以复制结果</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Examples */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">常用转换示例</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {examples.map((example, index) => (
                <div key={index} className="card bg-base-100 shadow-sm border border-base-300">
                  <div className="card-body p-4">
                    <h3 className="font-semibold text-sm mb-2">{example.desc}</h3>
                    <div className="space-y-1 text-xs">
                      <div><span className="font-mono bg-base-200 px-1 rounded">HEX:</span> {example.hex}</div>
                      <div><span className="font-mono bg-base-200 px-1 rounded">DEC:</span> {example.dec}</div>
                      <div><span className="font-mono bg-base-200 px-1 rounded">BIN:</span> {example.bin}</div>
                    </div>
                    <button
                      className="btn btn-xs btn-outline mt-2 w-full"
                      onClick={() => {
                        setInput(example.hex)
                        setInputType('hex')
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