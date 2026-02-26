import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ChecksumPage() {
  const [input, setInput] = useState('')
  const [checksumType, setChecksumType] = useState<'sum' | 'xor' | 'crc16' | 'crc32'>('sum')

  const calculateChecksum = (data: string, type: 'sum' | 'xor' | 'crc16' | 'crc32') => {
    if (!data.trim()) return ''

    try {
      const cleanData = data.replace(/\s+/g, '')
      if (cleanData.length % 2 !== 0) return 'Error: 数据长度必须是偶数'

      const bytes: number[] = []
      for (let i = 0; i < cleanData.length; i += 2) {
        const byte = parseInt(cleanData.substr(i, 2), 16)
        if (isNaN(byte)) return 'Error: 包含无效的十六进制字符'
        bytes.push(byte)
      }

      switch (type) {
        case 'sum':
          return calculateSum(bytes)
        case 'xor':
          return calculateXor(bytes)
        case 'crc16':
          return calculateCRC16(bytes)
        case 'crc32':
          return calculateCRC32(bytes)
        default:
          return ''
      }
    } catch (error) {
      return 'Error: 计算失败'
    }
  }

  const calculateSum = (bytes: number[]): string => {
    const sum = bytes.reduce((acc, byte) => acc + byte, 0)
    return (sum & 0xFF).toString(16).toUpperCase().padStart(2, '0')
  }

  const calculateXor = (bytes: number[]): string => {
    const xor = bytes.reduce((acc, byte) => acc ^ byte, 0)
    return xor.toString(16).toUpperCase().padStart(2, '0')
  }

  const calculateCRC16 = (bytes: number[]): string => {
    let crc = 0xFFFF
    const polynomial = 0xA001

    for (const byte of bytes) {
      crc ^= byte
      for (let i = 0; i < 8; i++) {
        if (crc & 1) {
          crc = (crc >> 1) ^ polynomial
        } else {
          crc >>= 1
        }
      }
    }

    return crc.toString(16).toUpperCase().padStart(4, '0')
  }

  const calculateCRC32 = (bytes: number[]): string => {
    const crcTable: number[] = []
    for (let i = 0; i < 256; i++) {
      let crc = i
      for (let j = 0; j < 8; j++) {
        crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1)
      }
      crcTable[i] = crc
    }

    let crc = 0xFFFFFFFF
    for (const byte of bytes) {
      crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
    }

    return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).toUpperCase().padStart(8, '0')
  }

  const result = calculateChecksum(input, checksumType)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatInput = () => {
    const cleaned = input.replace(/[^0-9A-Fa-f]/g, '')
    const formatted = cleaned.replace(/(.{2})/g, '$1 ').trim().toUpperCase()
    setInput(formatted)
  }

  const examples = [
    {
      name: 'DLT645 帧头',
      data: '68 10 10 68',
      desc: 'DLT645协议帧头部分'
    },
    {
      name: '简单数据',
      data: 'AA BB CC DD',
      desc: '4字节测试数据'
    },
    {
      name: '长数据',
      data: '68 10 10 68 AA AA AA AA AA AA 81 16',
      desc: '完整的DLT645报文示例'
    },
    {
      name: '单字节',
      data: 'FF',
      desc: '单字节最大值'
    }
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
              <h1 className="text-xl font-bold">校验和计算器</h1>
              <p className="text-sm text-base-content/70">支持多种校验和算法</p>
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
                  数据输入
                </h2>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-medium">校验算法</span>
                  </label>
                  <div className="tabs tabs-boxed">
                    <button
                      className={`tab tab-sm ${checksumType === 'sum' ? 'tab-active' : ''}`}
                      onClick={() => setChecksumType('sum')}
                    >
                      求和
                    </button>
                    <button
                      className={`tab tab-sm ${checksumType === 'xor' ? 'tab-active' : ''}`}
                      onClick={() => setChecksumType('xor')}
                    >
                      异或
                    </button>
                    <button
                      className={`tab tab-sm ${checksumType === 'crc16' ? 'tab-active' : ''}`}
                      onClick={() => setChecksumType('crc16')}
                    >
                      CRC16
                    </button>
                    <button
                      className={`tab tab-sm ${checksumType === 'crc32' ? 'tab-active' : ''}`}
                      onClick={() => setChecksumType('crc32')}
                    >
                      CRC32
                    </button>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">十六进制数据</span>
                    <span className="label-text-alt">支持空格分隔</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24 font-mono"
                    placeholder="例如: 68 10 10 68 AA AA AA AA AA AA 81 16"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
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
                    onClick={formatInput}
                  >
                    格式化
                  </button>
                </div>

                {/* Algorithm Description */}
                <div className="alert alert-info mt-4">
                  <svg className="w-6 h-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div className="text-sm">
                    <div className="font-bold">
                      {checksumType === 'sum' && '求和校验 (Checksum)'}
                      {checksumType === 'xor' && '异或校验 (XOR)'}
                      {checksumType === 'crc16' && 'CRC16 校验'}
                      {checksumType === 'crc32' && 'CRC32 校验'}
                    </div>
                    <div className="text-xs mt-1">
                      {checksumType === 'sum' && '将所有字节相加，取低8位'}
                      {checksumType === 'xor' && '将所有字节进行异或运算'}
                      {checksumType === 'crc16' && '使用CRC16-MODBUS算法'}
                      {checksumType === 'crc32' && '使用CRC32算法'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Result Section */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  校验结果
                </h2>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      {checksumType === 'sum' && '求和校验值'}
                      {checksumType === 'xor' && '异或校验值'}
                      {checksumType === 'crc16' && 'CRC16 校验值'}
                      {checksumType === 'crc32' && 'CRC32 校验值'}
                    </span>
                  </label>
                  <div className="join">
                    <input
                      type="text"
                      className={`input input-bordered join-item flex-1 font-mono text-lg ${
                        result.startsWith('Error') ? 'input-error' : 'input-success'
                      }`}
                      value={result}
                      readOnly
                      placeholder="校验结果将显示在这里"
                    />
                    <button
                      className="btn btn-outline join-item"
                      onClick={() => copyToClipboard(result)}
                      disabled={!result || result.startsWith('Error')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {result && !result.startsWith('Error') && (
                  <div className="alert alert-success mt-4">
                    <svg className="w-6 h-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                      <h3 className="font-bold">计算完成!</h3>
                      <div className="text-xs">
                        校验值: <span className="font-mono font-bold">{result}</span>
                      </div>
                    </div>
                  </div>
                )}

                {result.startsWith('Error') && (
                  <div className="alert alert-error mt-4">
                    <svg className="w-6 h-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                      <h3 className="font-bold">计算失败</h3>
                      <div className="text-xs">{result}</div>
                    </div>
                  </div>
                )}

                {/* Data Statistics */}
                {input && !result.startsWith('Error') && (
                  <div className="stats shadow mt-4">
                    <div className="stat py-2">
                      <div className="stat-title text-xs">数据长度</div>
                      <div className="stat-value text-sm">
                        {Math.floor(input.replace(/\s+/g, '').length / 2)} 字节
                      </div>
                      <div className="stat-desc text-xs">
                        {input.replace(/\s+/g, '').length} 个字符
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
                      onClick={() => setInput(example.data)}
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