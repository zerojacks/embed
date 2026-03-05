import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Database, Play, Trash2 } from 'lucide-react'
import { useWasm } from '../../contexts/WasmContext'
import { TreeTable } from "../../components/treeview"
import type { Column } from "../../components/treeview"
import type { TreeItemType } from '../../components/TreeItem'
import type { ProtocolType, AnalysisResult } from '../../types'

export default function ItemdataPrasePage() {
  const [dataItem, setDataItem] = useState('')
  const [content, setContent] = useState('')
  const [protocol, setProtocol] = useState<ProtocolType>('CSG13')
  const [region, setRegion] = useState('南网')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tableData, setTableData] = useState<TreeItemType[]>([])

  const { praseItemData, availableProtocols } = useWasm()

  // 省份选项 - 参考AnalysisPage.tsx
  const getRegions = () => ["南网", "云南", "广东", "深圳", "广西", "贵州", "海南"]

  // TreeTable 列配置 - 参考AnalysisPage.tsx
  const initialColumns: Column[] = [
    { name: '帧域', width: 200, minWidth: 120 },
    { name: '数据', width: 150, minWidth: 80 },
    { name: '说明', width: 300, minWidth: 100 },
  ]

  // 转换数据格式为TreeTable需要的格式 - 参考AnalysisPage.tsx
  const convertToTreeData = (data: any[]): TreeItemType[] => {
    if (!Array.isArray(data)) return []

    return data.map((item, index) => ({
      frameDomain: item.frameDomain || item.name || `字段${index + 1}`,
      data: item.data || item.value || '',
      description: item.description || item.desc || '',
      position: item.position || undefined,
      color: item.color || null,
      children: item.children ? convertToTreeData(item.children) : undefined
    }))
  }

  const handleParse = async () => {
    if (!dataItem.trim() || !content.trim()) {
      toast.error('请输入数据项和内容')
      return
    }

    setIsLoading(true)
    try {
      const analysisResult = await praseItemData(dataItem.trim(), content.trim(), protocol, region)
      setResult(analysisResult)

      if (analysisResult.success) {
        // 转换数据为TreeTable格式
        const treeData = convertToTreeData(analysisResult.data)
        setTableData(treeData)
        toast.success('解析完成')
      } else {
        toast.error(analysisResult.error)
        setTableData([])
      }
    } catch (error) {
      setResult(null)
      setTableData([])
    } finally {
      setIsLoading(false)
    }
  }

  // 自动解析函数 - 当协议或省份变化时调用
  const handleAutoParseIfReady = async (newProtocol?: ProtocolType, newRegion?: string) => {
    // 如果数据项和内容都有值，且当前没有在解析中，则自动解析
    if (dataItem.trim() && content.trim() && !isLoading) {
      setIsLoading(true)
      try {
        const analysisResult = await praseItemData(
          dataItem.trim(),
          content.trim(),
          newProtocol || protocol,
          newRegion || region
        )
        setResult(analysisResult)

        if (analysisResult.success) {
          const treeData = convertToTreeData(analysisResult.data)
          setTableData(treeData)
        } else {
          setTableData([])
        }
      } catch (error) {
        console.error('自动解析错误:', error)
        setResult(null)
        setTableData([])
      } finally {
        setIsLoading(false)
      }
    }
  }

  // 处理协议类型变化
  const handleProtocolChange = (newProtocol: ProtocolType) => {
    setProtocol(newProtocol)
    handleAutoParseIfReady(newProtocol, region)
  }

  // 处理省份区域变化
  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion)
    handleAutoParseIfReady(protocol, newRegion)
  }

  const onRowClick = (_item: TreeItemType) => {
    // 处理行点击事件

  }

  const clearAll = () => {
    setDataItem('')
    setContent('')
    setResult(null)
    setTableData([])
  }

  // 根据协议类型获取数据内容的描述
  const getContentDescription = () => {
    if (protocol === 'DLT/645-2007') {
      return '输入加33H后的16进制数据'
    }
    return '输入16进制数据'
  }

  // 根据协议类型获取数据内容的占位符
  const getContentPlaceholder = () => {
    if (protocol === 'DLT/645-2007') {
      return '例如: 3333333374233FFFFFFFFFFFFFFFFFFFFF (已加33H)'
    }
    return '例如: 0000000074233FFFFFFFFFFFFFFFFFFFFF'
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
            <Database className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">数据项内容解析</h1>
              <p className="text-sm text-base-content/70">解析协议数据项的具体内容</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Input Section */}
        <div className="shrink-0 p-4 border-b border-base-300 bg-base-100 space-y-3">
          {/* 数据标识 */}
          <div className="flex items-center gap-3">
            <label className="label-text text-sm font-medium min-w-fit">数据标识</label>
            <input
              type="text"
              className="input input-bordered font-mono flex-1"
              placeholder="0201FF00"
              value={dataItem}
              onChange={(e) => setDataItem(e.target.value)}
            />
          </div>

          {/* 数据内容 */}
          <div className="flex items-start gap-3">
            <label className="label-text text-sm font-medium min-w-fit pt-3">数据内容</label>
            <div className="flex-1">
              <textarea
                className="textarea textarea-bordered h-20 font-mono resize-none w-full"
                placeholder={getContentPlaceholder()}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="mt-1 text-xs text-primary">
                {getContentDescription()}
              </div>
            </div>
          </div>

          {/* 协议类型和省份区域 */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <label className="label-text text-sm font-medium min-w-fit">协议类型</label>
              <select
                className="select select-bordered select-sm"
                value={protocol}
                onChange={(e) => handleProtocolChange(e.target.value as ProtocolType)}
              >
                {availableProtocols.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="label-text text-sm font-medium min-w-fit">省份/区域</label>
              <select
                className="select select-bordered select-sm"
                value={region}
                onChange={(e) => handleRegionChange(e.target.value)}
              >
                {getRegions().map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 ml-auto">
              <button
                className="btn btn-outline btn-sm"
                onClick={clearAll}
              >
                <Trash2 className="w-4 h-4" />
                清空
              </button>
              <button
                className={`btn btn-primary btn-sm ${isLoading ? 'loading' : ''}`}
                onClick={handleParse}
                disabled={isLoading || !dataItem.trim() || !content.trim()}
              >
                {!isLoading && <Play className="w-4 h-4" />}
                开始解析
              </button>
            </div>
          </div>
        </div>

        {/* 解析结果 - 填充剩余空间 */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {result && result.success && tableData.length > 0 ? (
            <TreeTable
              data={tableData}
              tableheads={initialColumns}
              onRowClick={onRowClick}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-base-50">
              <div className="text-center">
                <Database className="w-12 h-12 text-base-content/20 mx-auto mb-3" />
                <p className="text-sm text-base-content/50">
                  {result && !result.success
                    ? '解析失败，请检查输入格式'
                    : '请输入数据项标识和内容进行解析'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}