import { Group, Panel, Separator } from "react-resizable-panels"
import { useFrameTreeStore } from '../stores/useFrameAnalysicStore'
import { useSplitSizeStore } from '../stores/useSplitSizeSlice'
import { useWasm } from '../contexts/WasmContext'
import { useEffect, useRef, useState } from "react"
import { toast } from 'react-hot-toast'
import { TreeTable } from "../components/treeview"
import type { Column } from "../components/treeview"
import type { TreeItemType } from '../components/TreeItem'

const initialColumns: Column[] = [
  { name: '帧域', width: 30, minWidth: 100 },
  { name: '数据', width: 30, minWidth: 50 },
  { name: '说明', width: 40, minWidth: 50 },
]

export default function AnalysisPage() {
  const {
    tabledata,
    frame,
    selectedframe,
    frameScroll,
    protocol,
    region,
    setTableData,
    setFrame,
    setSelectedFrame,
    setFrameScroll,
    setProtocol,
    setRegion,
  } = useFrameTreeStore()

  const { splitSize, setSplitSize } = useSplitSizeStore()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [selectedRegion] = useState('南网')

  const {
    analyzer,
    isLoading: wasmLoading,
    analyzeFrame
  } = useWasm()

  const getRegions = () => ['南网', '国网', '广东', '广西', '云南', '贵州', '海南']

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

  const handlePanelResize = (layout: { [panelId: string]: number }) => {
    const sizes = Object.values(layout)
    setSplitSize(sizes)
  }

  const handleInputChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    handleParse(newValue)
  }

  useEffect(() => {
    const start = selectedframe[0]
    const end = selectedframe[1]
    const textarea = textareaRef.current
    if (textarea) {
      textarea.setSelectionRange(start, end)
      textarea.focus()

      const computedStyle = getComputedStyle(textarea)
      const charWidth = parseInt(computedStyle.fontSize, 10)
      const lineHeight = parseInt(computedStyle.lineHeight, 10)
      const lineSpacing = lineHeight - parseInt(computedStyle.fontSize, 10)
      const lineCount = Math.floor(textarea.clientWidth / charWidth) * 2
      const startLine = Math.floor(start / lineCount)
      const scrollTop = (startLine - 1) * (lineHeight + lineSpacing)
      const startCharIndex = start % lineCount
      const scrollLeft = startCharIndex * charWidth
      setFrameScroll([scrollTop, scrollLeft])
    }
  }, [selectedframe])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      const scrollTop = frameScroll[0]
      const scrollLeft = frameScroll[1]
      textarea.scrollTop = scrollTop
      textarea.scrollLeft = scrollLeft
    }
  }, [frameScroll])

  const clearTableData = () => {
    setTableData([])
    setFrame("")
  }

  const handleRowClick = (item: TreeItemType) => {
    if (item.position && item.position.length === 2) {
      let start = item.position[0]
      let end = item.position[1]
      let length = end - start
      length = length * 2 + (length - 1)
      start = start * 2 + start
      end = start + length
      setSelectedFrame([start, end])
    }
  }

  const handleParse = async (text: string, region: string = "") => {
    try {
      const formattedValue = text
        .replace(/\s+/g, '')
        .replace(/(.{2})/g, '$1 ')
        .trim()
        .toUpperCase()

      clearTableData()
      setFrame(formattedValue)

      if (formattedValue === "") {
        return
      }

      if (!analyzer) {
        toast.error('WASM模块未初始化')
        return
      }

      try {
        if (region === "") {
          region = selectedRegion || "南网"
          setRegion(region)
        }

        const analysisResult = await analyzeFrame(
          formattedValue.replace(/\s+/g, ''),
          region
        )

        if (analysisResult.success) {
          const treeData = convertToTreeData(analysisResult.data)
          setTableData(treeData)

          if (analysisResult.protocol) {
            setProtocol(analysisResult.protocol)
          }
          if (analysisResult.region) {
            setRegion(analysisResult.region)
          }

          toast.success(`${analysisResult.protocol} 协议解析成功`)
        } else {
          toast.error("解析失败！")
          setTableData([])
          setProtocol("自适应")
        }
      } catch (error) {
        console.error("解析失败:", error)
        toast.error("解析失败！")
        setTableData([])
        setProtocol("自适应")
      } finally {
      }
    } catch (error) {
      console.error('解析失败:', error)
      toast.error("解析失败！")
      setTableData([])
      setProtocol("自适应")
    }
  }

  const handle_region_change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRegion = e.target.value
    setRegion(newRegion)
    if (frame) handleParse(frame, newRegion)
  }

  return (
    <div className="h-full flex flex-col">
      <Group orientation="vertical" className="grow" onLayoutChanged={handlePanelResize}>
        {/* Input Panel */}
        <Panel defaultSize={splitSize[0]} minSize={0}>
          <div className="h-full p-2">
            <textarea
              ref={textareaRef}
              className="textarea textarea-bordered w-full h-full font-mono"
              value={frame}
              onChange={handleInputChange}
              placeholder="请输入要解析的报文..."
            />
          </div>
        </Panel>

        <Separator className="h-1 bg-base-300 hover:bg-primary/30 transition-colors cursor-row-resize">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-0.5 bg-base-content/20 rounded-full"></div>
          </div>
        </Separator>

        {/* Results Panel */}
        <Panel defaultSize={splitSize[1]} minSize={30}>
          <div className="h-full flex flex-col">
            {/* Control Bar */}
            <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-100">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium shrink-0">协议:</span>
                  <div className="badge badge-primary badge-sm">
                    {protocol || '自适应'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium shrink-0">地区:</span>
                  <select
                    className="select select-bordered select-xs"
                    value={region}
                    onChange={handle_region_change}
                  >
                    {getRegions().map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Results Content */}
            <div className="flex-1 overflow-hidden">
              {wasmLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <div className="mt-4 text-sm font-medium">正在初始化WASM模块</div>
                    <div className="text-xs text-base-content/70">请稍候...</div>
                  </div>
                </div>
              ) : (
                <TreeTable
                  data={tabledata}
                  tableheads={initialColumns}
                  onRowClick={handleRowClick}
                />
              )}
            </div>
          </div>
        </Panel>
      </Group>
    </div>
  )
}