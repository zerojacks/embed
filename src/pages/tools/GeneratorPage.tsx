import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import ParamFrame from './CSGFrame/paramFrame'
import CurFrame from './CSGFrame/curFrame'
import HistoryFrame from './CSGFrame/historyFrame'
import AlarmEventFrame from './CSGFrame/alarmEventFrame'
import NormalTaskFrame from './CSGFrame/normalTaskFrame'
import MeterTaskFrame from './CSGFrame/meterTaskFrame'
import AutoConfigFrame from './CSGFrame/autoConfigFrame'

const FrameType = {
  param: "参数类",
  curdata: '当前数据类',
  history: '历史数据类',
  alarm: '告警类',
  event: '事件类',
  normaltask: '普通任务',
  metertask: '表端任务',
  autoconfig: '自动配置'
} as const

type CSGFrameType = keyof typeof FrameType

interface GeneratedFrameRecord {
  id: string
  type: CSGFrameType
  typeName: string
  frame: string
  timestamp: number
  params: any // 保存生成报文时的参数
}

export default function GeneratorPage() {
  const [activeTab, setActiveTab] = useState<CSGFrameType>('param')
  const [frameHistory, setFrameHistory] = useState<GeneratedFrameRecord[]>([])
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null)
  const [editingRecord, setEditingRecord] = useState<GeneratedFrameRecord | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const handleFrameGenerator = (frame: number[], params?: any) => {
    // 将 number[] 转换为十六进制字符串
    const hexFrame = frame.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ')

    // 创建新的报文记录
    const newRecord: GeneratedFrameRecord = {
      id: Date.now().toString(),
      type: activeTab,
      typeName: FrameType[activeTab],
      frame: hexFrame,
      timestamp: Date.now(),
      params: params || {} // 保存参数
    }

    // 添加到历史记录，保持最多50条
    setFrameHistory(prev => {
      const updated = [newRecord, ...prev]
      return updated.slice(0, 50) // 保持最多50条记录
    })

    // 自动选中新生成的报文
    setSelectedFrameId(newRecord.id)
    toast.success('报文生成成功')
  }

  const copyToClipboard = (frame?: string) => {
    const frameToCopy = frame || (selectedFrameId ? frameHistory.find(f => f.id === selectedFrameId)?.frame : '')
    if (frameToCopy) {
      navigator.clipboard.writeText(frameToCopy)
      toast.success('已复制到剪贴板')
    }
  }

  const clearHistory = () => {
    setFrameHistory([])
    setSelectedFrameId(null)
    toast.success('历史记录已清空')
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const handleEditRecord = (record: GeneratedFrameRecord) => {
    setEditingRecord(record)
    setActiveTab(record.type) // 切换到对应的tab
    setShowEditDialog(true)
  }

  const handleCloseEditDialog = () => {
    setShowEditDialog(false)
    setEditingRecord(null)
  }

  const handleUpdateRecord = (frame: number[], params?: any) => {
    if (!editingRecord) return

    const hexFrame = frame.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ')

    // 更新记录
    const updatedRecord: GeneratedFrameRecord = {
      ...editingRecord,
      frame: hexFrame,
      params: params || {},
      timestamp: Date.now() // 更新时间戳
    }

    setFrameHistory(prev =>
      prev.map(record =>
        record.id === editingRecord.id ? updatedRecord : record
      )
    )

    setSelectedFrameId(updatedRecord.id)
    handleCloseEditDialog()
    toast.success('报文更新成功')
  }

  const selectedFrame = selectedFrameId ? frameHistory.find(f => f.id === selectedFrameId) : null

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-base-300">
        <div className="flex items-center gap-4">
          <Link to="/tools" className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">报文生成器</h1>
            <p className="text-sm text-base-content/70 mt-1">
              生成标准协议报文
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 px-6 pt-4">
        <div className="tabs tabs-boxed bg-base-200">
          {Object.entries(FrameType).map(([key, value]) => (
            <button
              key={key}
              className={`tab ${activeTab === key ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(key as CSGFrameType)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Content - 左右分栏布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧配置区域 */}
        <div className="w-1/2 border-r border-base-300 flex flex-col">
          <div className="p-6 h-full flex flex-col">
            <div className="h-full flex flex-col">
              {/* CSG Frame Components */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'param' && (
                  <ParamFrame onFrameGenerator={handleFrameGenerator} />
                )}
                {activeTab === 'curdata' && (
                  <CurFrame onFrameGenerator={handleFrameGenerator} />
                )}
                {activeTab === 'history' && (
                  <HistoryFrame onFrameGenerator={handleFrameGenerator} />
                )}
                {(activeTab === 'alarm' || activeTab === 'event') && (
                  <AlarmEventFrame
                    key={activeTab} // 添加key确保类型切换时重新创建组件实例
                    onFrameGenerator={handleFrameGenerator}
                    type={activeTab === 'alarm' ? 'alarm' : 'event'}
                  />
                )}
                {activeTab === 'normaltask' && (
                  <NormalTaskFrame onFrameGenerator={handleFrameGenerator} />
                )}
                {activeTab === 'metertask' && (
                  <MeterTaskFrame onFrameGenerator={handleFrameGenerator} />
                )}
                {activeTab === 'autoconfig' && (
                  <AutoConfigFrame onFrameGenerator={handleFrameGenerator} />
                )}
                {!['param', 'curdata', 'history', 'alarm', 'event', 'normaltask', 'metertask', 'autoconfig'].includes(activeTab) && (
                  <div className="card bg-base-100 shadow-lg border border-base-300 h-full">
                    <div className="card-body flex items-center justify-center">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">{FrameType[activeTab]}</h3>
                        <p className="text-base-content/70 mb-4">
                          此类型的报文生成器正在开发中
                        </p>
                        <div className="alert alert-info">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span>敬请期待！</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧报文显示区域 */}
        <div className="w-1/2 overflow-auto">
          <div className="p-6 h-full flex flex-col">
            <div className="card bg-base-100 shadow-lg border border-base-300 h-full flex flex-col">
              <div className="card-body flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <h2 className="card-title">报文历史记录</h2>
                  <div className="flex gap-2">
                    {frameHistory.length > 0 && (
                      <button
                        className="btn btn-outline btn-error btn-sm"
                        onClick={clearHistory}
                      >
                        清空历史
                      </button>
                    )}
                  </div>
                </div>

                {frameHistory.length > 0 ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* 历史记录列表 */}
                    <div className="flex-1 overflow-auto mb-4">
                      <div className="space-y-3 px-1 pt-1 pb-1">
                        {frameHistory.map((record) => (
                          <div
                            key={record.id}
                            className={`card bg-base-200 cursor-pointer transition-all hover:bg-base-300 ${selectedFrameId === record.id ? 'ring-2 ring-primary' : ''
                              }`}
                            onClick={() => setSelectedFrameId(record.id)}
                          >
                            <div className="card-body p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="badge badge-primary badge-sm">{record.typeName}</div>
                                  <span className="text-xs text-base-content/70">
                                    {formatTimestamp(record.timestamp)}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    className="btn btn-xs btn-ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditRecord(record)
                                    }}
                                  >
                                    编辑
                                  </button>
                                  <button
                                    className="btn btn-xs btn-ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      copyToClipboard(record.frame)
                                    }}
                                  >
                                    复制
                                  </button>
                                </div>
                              </div>
                              <div className="text-xs font-mono bg-base-100 p-3 rounded overflow-hidden">
                                <div className="truncate">
                                  {record.frame}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 选中报文详情 */}
                    {selectedFrame && (
                      <div className="shrink-0 border-t border-base-300 pt-4">
                        <h3 className="font-semibold mb-3">报文详情</h3>
                        <div className="space-y-3">
                          <div className="bg-base-200 rounded-lg p-4 border border-base-300">
                            <div className="text-xs font-mono break-all leading-relaxed">
                              {selectedFrame.frame}
                            </div>
                          </div>
                          <div className="flex items-center justify-between bg-base-200 rounded-lg p-3 border border-base-300">
                            <span className="text-sm font-medium">报文长度</span>
                            <span className="text-sm font-mono">
                              {selectedFrame.frame.replace(/\s/g, '').length / 2} 字节
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-base-content/50">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0-1.125.504-1.125 1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <p className="text-lg font-medium mb-2">暂无报文历史</p>
                    <p className="text-sm text-center">
                      在左侧配置参数并点击"生成报文"按钮<br />
                      生成的报文将在此处显示
                    </p>
                    <div className="mt-4 text-xs text-base-content/40">
                      最多保存50条历史记录
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 编辑对话框 */}
      {showEditDialog && editingRecord && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-6xl h-[90vh] max-h-[90vh] p-0 flex flex-col">
            {/* 对话框头部 */}
            <div className="flex items-center justify-between p-6 pb-4 shrink-0 border-b border-base-300">
              <h3 className="font-bold text-lg">编辑报文 - {editingRecord.typeName}</h3>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={handleCloseEditDialog}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Frame组件容器 - 模拟左侧的p-6容器 */}
            <div className="flex-1 overflow-hidden min-h-0 p-6">
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-hidden">
                  {editingRecord.type === 'param' && (
                    <ParamFrame
                      key={editingRecord.id}
                      onFrameGenerator={handleUpdateRecord}
                      initialParams={editingRecord.params}
                    />
                  )}
                  {editingRecord.type === 'curdata' && (
                    <CurFrame
                      onFrameGenerator={handleUpdateRecord}
                      initialParams={editingRecord.params}
                    />
                  )}
                  {editingRecord.type === 'history' && (
                    <HistoryFrame
                      onFrameGenerator={handleUpdateRecord}
                      initialParams={editingRecord.params}
                    />
                  )}
                  {(editingRecord.type === 'alarm' || editingRecord.type === 'event') && (
                    <AlarmEventFrame
                      onFrameGenerator={handleUpdateRecord}
                      type={editingRecord.type === 'alarm' ? 'alarm' : 'event'}
                      initialParams={editingRecord.params}
                    />
                  )}
                  {editingRecord.type === 'normaltask' && (
                    <NormalTaskFrame
                      onFrameGenerator={handleUpdateRecord}
                      initialParams={editingRecord.params}
                    />
                  )}
                  {editingRecord.type === 'metertask' && (
                    <MeterTaskFrame
                      onFrameGenerator={handleUpdateRecord}
                      initialParams={editingRecord.params}
                    />
                  )}
                  {editingRecord.type === 'autoconfig' && (
                    <AutoConfigFrame
                      onFrameGenerator={handleUpdateRecord}
                      initialParams={editingRecord.params}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={handleCloseEditDialog}></div>
        </div>
      )}
    </div>
  )
}