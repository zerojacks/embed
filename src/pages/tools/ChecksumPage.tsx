import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Calculator, Copy, CheckCircle, AlertCircle, Info, Edit, Target } from 'lucide-react'
import { pppFcs16 } from '../../utils/pppFcs'

export default function ChecksumPage() {
  const [input, setInput] = useState('')
  const [checksumType, setChecksumType] = useState<'sum' | 'xor' | 'crc16' | 'crc32'>('sum')
  const [crcVariant, setCrcVariant] = useState<string>('modbus') // CRC变体

  // CRC16 变体配置
  const crc16Variants = {
    modbus: { name: 'CRC16-MODBUS', poly: 0xA001, init: 0xFFFF, refIn: true, refOut: true, xorOut: 0x0000 },
    ccitt: { name: 'CRC16-CCITT', poly: 0x1021, init: 0xFFFF, refIn: false, refOut: false, xorOut: 0x0000 },
    ccitt_false: { name: 'CRC16-CCITT-FALSE', poly: 0x1021, init: 0xFFFF, refIn: false, refOut: false, xorOut: 0x0000 },
    xmodem: { name: 'CRC16-XMODEM', poly: 0x1021, init: 0x0000, refIn: false, refOut: false, xorOut: 0x0000 },
    x25: { name: 'CRC16-X25', poly: 0x1021, init: 0xFFFF, refIn: true, refOut: true, xorOut: 0xFFFF },
    ppp: { name: 'CRC16-PPP FCS', poly: 0x1021, init: 0xFFFF, refIn: true, refOut: true, xorOut: 0xFFFF },
    usb: { name: 'CRC16-USB', poly: 0x8005, init: 0xFFFF, refIn: true, refOut: true, xorOut: 0xFFFF },
    ibm: { name: 'CRC16-IBM', poly: 0x8005, init: 0x0000, refIn: true, refOut: true, xorOut: 0x0000 }
  }

  // CRC32 变体配置
  const crc32Variants = {
    ieee: { name: 'CRC32-IEEE 802.3', poly: 0xEDB88320, init: 0xFFFFFFFF, refIn: true, refOut: true, xorOut: 0xFFFFFFFF },
    castagnoli: { name: 'CRC32C (Castagnoli)', poly: 0x82F63B78, init: 0xFFFFFFFF, refIn: true, refOut: true, xorOut: 0xFFFFFFFF },
    koopman: { name: 'CRC32K (Koopman)', poly: 0xEB31D82E, init: 0xFFFFFFFF, refIn: true, refOut: true, xorOut: 0xFFFFFFFF },
    q: { name: 'CRC32Q', poly: 0xD5828281, init: 0x00000000, refIn: false, refOut: false, xorOut: 0x00000000 }
  }

  const calculateChecksum = (data: string, type: 'sum' | 'xor' | 'crc16' | 'crc32') => {
    if (!data.trim()) return { value: 0, error: '' }

    try {
      const cleanData = data.replace(/\s+/g, '')
      if (cleanData.length % 2 !== 0) return { value: 0, error: 'Error: 数据长度必须是偶数' }

      const bytes: number[] = []
      for (let i = 0; i < cleanData.length; i += 2) {
        const byte = parseInt(cleanData.substr(i, 2), 16)
        if (isNaN(byte)) return { value: 0, error: 'Error: 包含无效的十六进制字符' }
        bytes.push(byte)
      }

      switch (type) {
        case 'sum':
          return { value: calculateSum(bytes), error: '' }
        case 'xor':
          return { value: calculateXor(bytes), error: '' }
        case 'crc16':
          return { value: calculateCRC16(bytes), error: '' }
        case 'crc32':
          return { value: calculateCRC32(bytes), error: '' }
        default:
          return { value: 0, error: '' }
      }
    } catch (error) {
      return { value: 0, error: 'Error: 计算失败' }
    }
  }

  const calculateSum = (bytes: number[]): number => {
    const sum = bytes.reduce((acc, byte) => acc + byte, 0)
    return sum & 0xFF
  }

  const calculateXor = (bytes: number[]): number => {
    const xor = bytes.reduce((acc, byte) => acc ^ byte, 0)
    return xor
  }

  // 通用 CRC 计算函数 - 返回数值
  const calculateGenericCRCNumber = (bytes: number[], config: any, width: number): number => {
    const { poly, init, refIn, refOut, xorOut } = config

    // 反转字节位序
    const reverseBits = (value: number, bits: number): number => {
      let result = 0
      for (let i = 0; i < bits; i++) {
        result = (result << 1) | (value & 1)
        value >>= 1
      }
      return result
    }

    let crc = init
    const mask = (1 << width) - 1

    for (const byte of bytes) {
      const data = refIn ? reverseBits(byte, 8) : byte

      if (width === 16) {
        crc ^= data << 8
        for (let i = 0; i < 8; i++) {
          if (crc & 0x8000) {
            crc = (crc << 1) ^ poly
          } else {
            crc <<= 1
          }
          crc &= 0xFFFF
        }
      } else if (width === 32) {
        crc ^= data << 24
        for (let i = 0; i < 8; i++) {
          if (crc & 0x80000000) {
            crc = (crc << 1) ^ poly
          } else {
            crc <<= 1
          }
          crc = crc >>> 0 // 确保无符号32位
        }
      }
    }

    if (refOut) {
      crc = reverseBits(crc, width)
    }

    crc ^= xorOut
    crc &= mask

    return crc
  }

  const calculateCRC16 = (bytes: number[]): number => {
    const variant = crc16Variants[crcVariant as keyof typeof crc16Variants]
    if (!variant) return 0

    // 使用专门的PPP FCS算法
    if (crcVariant === 'ppp') {
      const fcs = pppFcs16(0xFFFF, bytes)
      return fcs & 0xFFFF
    }

    // 对于反向多项式的算法（如MODBUS），使用查表法
    if (variant.refIn && variant.refOut) {
      let crc = variant.init
      const polynomial = variant.poly

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

      crc ^= variant.xorOut
      return crc & 0xFFFF
    } else {
      // 使用通用算法 - 需要修改为返回数值
      return calculateGenericCRCNumber(bytes, variant, 16)
    }
  }

  const calculateCRC32 = (bytes: number[]): number => {
    const variant = crc32Variants[crcVariant as keyof typeof crc32Variants]
    if (!variant) return 0

    // 使用查表法优化
    const crcTable: number[] = []
    for (let i = 0; i < 256; i++) {
      let crc = i
      for (let j = 0; j < 8; j++) {
        if (variant.refIn) {
          crc = (crc & 1) ? (variant.poly ^ (crc >>> 1)) : (crc >>> 1)
        } else {
          crc = (crc & 0x80000000) ? ((crc << 1) ^ variant.poly) : (crc << 1)
        }
      }
      crcTable[i] = crc >>> 0
    }

    let crc = variant.init
    for (const byte of bytes) {
      if (variant.refIn) {
        crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
      } else {
        crc = crcTable[((crc >>> 24) ^ byte) & 0xFF] ^ (crc << 8)
      }
      crc = crc >>> 0
    }

    crc ^= variant.xorOut
    return crc >>> 0
  }

  const result = calculateChecksum(input, checksumType)

  const copyToClipboard = async (text: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast.success('已复制到剪贴板')
    } catch {
      toast.error('复制失败')
    }
  }

  const formatInput = () => {
    const cleaned = input.replace(/[^0-9A-Fa-f]/g, '')
    const formatted = cleaned.replace(/(.{2})/g, '$1 ').trim().toUpperCase()
    setInput(formatted)
  }

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
                  <Edit className="w-5 h-5" />
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
                      onClick={() => {
                        setChecksumType('crc16')
                        setCrcVariant('modbus') // 重置为默认CRC16变体
                      }}
                    >
                      CRC16
                    </button>
                    <button
                      className={`tab tab-sm ${checksumType === 'crc32' ? 'tab-active' : ''}`}
                      onClick={() => {
                        setChecksumType('crc32')
                        setCrcVariant('ieee') // 重置为默认CRC32变体
                      }}
                    >
                      CRC32
                    </button>
                  </div>
                </div>

                {/* CRC Variant Selector */}
                {(checksumType === 'crc16' || checksumType === 'crc32') && (
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium">
                        {checksumType === 'crc16' ? 'CRC16 变体' : 'CRC32 变体'}
                      </span>
                    </label>
                    <select
                      className="select select-bordered select-sm"
                      value={crcVariant}
                      onChange={(e) => setCrcVariant(e.target.value)}
                    >
                      {checksumType === 'crc16' && Object.entries(crc16Variants).map(([key, variant]) => (
                        <option key={key} value={key}>{variant.name}</option>
                      ))}
                      {checksumType === 'crc32' && Object.entries(crc32Variants).map(([key, variant]) => (
                        <option key={key} value={key}>{variant.name}</option>
                      ))}
                    </select>
                  </div>
                )}

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
                  <Info className="w-6 h-6 shrink-0" />
                  <div className="text-sm">
                    <div className="font-bold">
                      {checksumType === 'sum' && '求和校验 (Checksum)'}
                      {checksumType === 'xor' && '异或校验 (XOR)'}
                      {checksumType === 'crc16' && (
                        crc16Variants[crcVariant as keyof typeof crc16Variants]?.name || 'CRC16 校验'
                      )}
                      {checksumType === 'crc32' && (
                        crc32Variants[crcVariant as keyof typeof crc32Variants]?.name || 'CRC32 校验'
                      )}
                    </div>
                    <div className="text-xs mt-2 space-y-1">
                      {checksumType === 'sum' && (
                        <div>算法: 将所有字节相加，取低8位作为校验值</div>
                      )}
                      {checksumType === 'xor' && (
                        <div>算法: 将所有字节进行异或运算</div>
                      )}
                      {checksumType === 'crc16' && (() => {
                        const variant = crc16Variants[crcVariant as keyof typeof crc16Variants]
                        if (!variant) return null

                        // 获取多项式函数表达式
                        const getPolynomialFunction = (poly: number) => {
                          switch (poly) {
                            case 0xA001: // MODBUS (反向)
                              return 'x^16 + x^15 + x^2 + 1 (反向: 0x8005)'
                            case 0x1021: // CCITT, CCITT-FALSE, XMODEM
                              return 'x^16 + x^12 + x^5 + 1'
                            case 0x8005: // USB, IBM
                              return 'x^16 + x^15 + x^2 + 1'
                            default:
                              return `多项式: 0x${poly.toString(16).toUpperCase()}`
                          }
                        }

                        return (
                          <>
                            <div><span className="font-semibold">多项式:</span> 0x{variant.poly.toString(16).toUpperCase()}</div>
                            <div><span className="font-semibold">初始值:</span> 0x{variant.init.toString(16).toUpperCase()}</div>
                            <div><span className="font-semibold">输入反转:</span> {variant.refIn ? '是' : '否'}</div>
                            <div><span className="font-semibold">输出反转:</span> {variant.refOut ? '是' : '否'}</div>
                            <div><span className="font-semibold">异或输出:</span> 0x{variant.xorOut.toString(16).toUpperCase()}</div>
                            <div className="mt-2 p-2 bg-base-200 border border-base-300 rounded">
                              <div className="font-semibold text-xs mb-1 text-base-content">多项式函数:</div>
                              <div className="font-mono text-xs text-base-content break-all">
                                {getPolynomialFunction(variant.poly)}
                              </div>
                            </div>
                          </>
                        )
                      })()}
                      {checksumType === 'crc32' && (() => {
                        const variant = crc32Variants[crcVariant as keyof typeof crc32Variants]
                        if (!variant) return null

                        // 获取多项式函数表达式
                        const getPolynomialFunction = (poly: number) => {
                          switch (poly) {
                            case 0xEDB88320: // IEEE 802.3 (反向)
                              return 'x^32 + x^26 + x^23 + x^22 + x^16 + x^12 + x^11 + x^10 + x^8 + x^7 + x^5 + x^4 + x^2 + x + 1'
                            case 0x82F63B78: // Castagnoli (反向)
                              return 'x^32 + x^28 + x^27 + x^26 + x^25 + x^23 + x^22 + x^20 + x^19 + x^18 + x^14 + x^13 + x^11 + x^10 + x^9 + x^8 + x^6 + 1'
                            case 0xEB31D82E: // Koopman (反向)
                              return 'x^32 + x^30 + x^29 + x^28 + x^26 + x^20 + x^19 + x^17 + x^16 + x^15 + x^11 + x^10 + x^7 + x^6 + x^4 + x^2 + x + 1'
                            case 0xD5828281: // CRC32Q
                              return 'x^32 + x^31 + x^30 + x^28 + x^26 + x^20 + x^19 + x^17 + x^16 + x^15 + x^11 + x^10 + x^7 + x^6 + x^4 + x^2 + x + 1'
                            default:
                              return `多项式: 0x${poly.toString(16).toUpperCase()}`
                          }
                        }

                        return (
                          <>
                            <div><span className="font-semibold">多项式:</span> 0x{variant.poly.toString(16).toUpperCase()}</div>
                            <div><span className="font-semibold">初始值:</span> 0x{variant.init.toString(16).toUpperCase()}</div>
                            <div><span className="font-semibold">输入反转:</span> {variant.refIn ? '是' : '否'}</div>
                            <div><span className="font-semibold">输出反转:</span> {variant.refOut ? '是' : '否'}</div>
                            <div><span className="font-semibold">异或输出:</span> 0x{variant.xorOut.toString(16).toUpperCase()}</div>
                            <div className="mt-2 p-2 bg-base-200 border border-base-300 rounded">
                              <div className="font-semibold text-xs mb-1 text-base-content">多项式函数:</div>
                              <div className="font-mono text-xs text-base-content break-all">
                                {getPolynomialFunction(variant.poly)}
                              </div>
                            </div>
                          </>
                        )
                      })()}
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
                  校验结果
                </h2>

                {/* 始终显示十六进制和十进制结果框 */}
                <div className="space-y-4">
                  {/* 十六进制结果 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold w-20 inline-block">十六进制</span>
                    </label>
                    <div className="join">
                      <input
                        type="text"
                        className={`input input-bordered join-item flex-1 font-mono text-lg ${result.error ? 'input-error' :
                          (result.value > 0 || input.trim()) ? 'input-success' : ''
                          }`}
                        value={
                          result.error ||
                          (result.value > 0 ?
                            result.value.toString(16).toUpperCase().padStart(
                              checksumType === 'sum' || checksumType === 'xor' ? 2 :
                                checksumType === 'crc16' ? 4 : 8, '0'
                            ) : ''
                          )
                        }
                        readOnly
                        placeholder="十六进制结果"
                      />
                      <button
                        className="btn btn-outline join-item"
                        onClick={() => copyToClipboard(
                          result.error ||
                          (result.value > 0 ?
                            result.value.toString(16).toUpperCase().padStart(
                              checksumType === 'sum' || checksumType === 'xor' ? 2 :
                                checksumType === 'crc16' ? 4 : 8, '0'
                            ) : ''
                          )
                        )}
                        disabled={!!result.error || result.value === 0}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 十进制结果 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold w-20 inline-block">十进制</span>
                    </label>
                    <div className="join">
                      <input
                        type="text"
                        className={`input input-bordered join-item flex-1 font-mono text-lg ${result.error ? 'input-error' :
                          (result.value > 0 || input.trim()) ? 'input-success' : ''
                          }`}
                        value={result.error || (result.value > 0 ? result.value.toString() : '')}
                        readOnly
                        placeholder="十进制结果"
                      />
                      <button
                        className="btn btn-outline join-item"
                        onClick={() => copyToClipboard(
                          result.error || (result.value > 0 ? result.value.toString() : '')
                        )}
                        disabled={!!result.error || result.value === 0}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {result.value > 0 && !result.error && (
                  <div className="alert alert-success mt-4">
                    <CheckCircle className="w-6 h-6 shrink-0" />
                    <div>
                      <h3 className="font-bold">计算完成!</h3>
                      <div className="text-xs">
                        <div>十六进制: <span className="font-mono font-bold">
                          {result.value.toString(16).toUpperCase().padStart(
                            checksumType === 'sum' || checksumType === 'xor' ? 2 :
                              checksumType === 'crc16' ? 4 : 8, '0'
                          )}
                        </span></div>
                        <div>十进制: <span className="font-mono font-bold">{result.value}</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {result.error && (
                  <div className="alert alert-error mt-4">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <div>
                      <h3 className="font-bold">计算失败</h3>
                      <div className="text-xs">{result.error}</div>
                    </div>
                  </div>
                )}

                {/* Data Statistics */}
                {input && !result.error && (
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
        </div>
      </div>
    </div>
  )
}