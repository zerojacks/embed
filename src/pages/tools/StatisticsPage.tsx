import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

interface AnalysisRecord {
  id: string
  timestamp: number
  protocol: string
  region: string
  frameLength: number
  success: boolean
  errorMessage?: string
}

interface StatisticsData {
  totalFrames: number
  successRate: number
  protocolDistribution: Record<string, number>
  regionDistribution: Record<string, number>
  errorTypes: Record<string, number>
  avgFrameLength: number
  recentActivity: AnalysisRecord[]
}

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalFrames: 0,
    successRate: 0,
    protocolDistribution: {},
    regionDistribution: {},
    errorTypes: {},
    avgFrameLength: 0,
    recentActivity: []
  })
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [loading, setLoading] = useState(false)

  // 模拟数据生成
  const generateMockData = (): StatisticsData => {
    const protocols = ['CSG13', 'CSG16', 'DLT/645-2007', 'Modbus', 'MS']
    const regions = ['南网', '国网', '蒙西', '其他']
    const errors = ['校验错误', '格式错误', '长度错误', '协议不支持', '数据异常']
    
    const totalFrames = Math.floor(Math.random() * 1000) + 100
    const successCount = Math.floor(totalFrames * (0.7 + Math.random() * 0.25))
    
    const protocolDistribution: Record<string, number> = {}
    const regionDistribution: Record<string, number> = {}
    const errorTypes: Record<string, number> = {}
    
    // 生成协议分布
    protocols.forEach(protocol => {
      protocolDistribution[protocol] = Math.floor(Math.random() * totalFrames * 0.3)
    })
    
    // 生成区域分布
    regions.forEach(region => {
      regionDistribution[region] = Math.floor(Math.random() * totalFrames * 0.4)
    })
    
    // 生成错误类型分布
    errors.forEach(error => {
      errorTypes[error] = Math.floor(Math.random() * (totalFrames - successCount) * 0.3)
    })
    
    // 生成最近活动记录
    const recentActivity: AnalysisRecord[] = []
    for (let i = 0; i < 10; i++) {
      recentActivity.push({
        id: `record_${i}`,
        timestamp: Date.now() - Math.random() * 24 * 60 * 60 * 1000,
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        region: regions[Math.floor(Math.random() * regions.length)],
        frameLength: Math.floor(Math.random() * 200) + 20,
        success: Math.random() > 0.3,
        errorMessage: Math.random() > 0.7 ? errors[Math.floor(Math.random() * errors.length)] : undefined
      })
    }
    
    return {
      totalFrames,
      successRate: (successCount / totalFrames) * 100,
      protocolDistribution,
      regionDistribution,
      errorTypes,
      avgFrameLength: Math.floor(Math.random() * 100) + 50,
      recentActivity: recentActivity.sort((a, b) => b.timestamp - a.timestamp)
    }
  }

  const loadStatistics = async () => {
    setLoading(true)
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      const data = generateMockData()
      setStatistics(data)
      toast.success('统计数据加载完成')
    } catch (error) {
      toast.error('加载统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatistics()
  }, [timeRange])

  const exportData = () => {
    const dataStr = JSON.stringify(statistics, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analysis_statistics_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('统计数据已导出')
  }

  const clearData = () => {
    if (confirm('确定要清空所有统计数据吗？此操作不可恢复。')) {
      setStatistics({
        totalFrames: 0,
        successRate: 0,
        protocolDistribution: {},
        regionDistribution: {},
        errorTypes: {},
        avgFrameLength: 0,
        recentActivity: []
      })
      toast.success('统计数据已清空')
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  const getTopItems = (distribution: Record<string, number>, limit = 5) => {
    return Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 p-6 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">数据统计</h1>
            <p className="text-sm text-base-content/70 mt-1">
              解析结果统计分析
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="badge badge-warning">开发中</div>
            <select 
              className="select select-bordered select-sm"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
            >
              <option value="1h">最近 1 小时</option>
              <option value="24h">最近 24 小时</option>
              <option value="7d">最近 7 天</option>
              <option value="30d">最近 30 天</option>
            </select>
            <button 
              className="btn btn-outline btn-sm"
              onClick={loadStatistics}
              disabled={loading}
            >
              {loading ? '加载中...' : '刷新'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Overview Stats */}
          <div className="stats stats-horizontal shadow w-full">
            <div className="stat">
              <div className="stat-figure text-primary">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="stat-title">总解析次数</div>
              <div className="stat-value text-primary">{statistics.totalFrames}</div>
              <div className="stat-desc">累计处理报文数量</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-success">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="stat-title">成功率</div>
              <div className="stat-value text-success">{statistics.successRate.toFixed(1)}%</div>
              <div className="stat-desc">解析成功的比例</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-info">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="stat-title">平均帧长</div>
              <div className="stat-value text-info">{statistics.avgFrameLength}</div>
              <div className="stat-desc">字节</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Protocol Distribution */}
            <div className="card bg-base-100 shadow-lg border border-base-300">
              <div className="card-body">
                <h2 className="card-title">协议分布</h2>
                <div className="space-y-3">
                  {getTopItems(statistics.protocolDistribution).map(([protocol, count]) => (
                    <div key={protocol} className="flex items-center justify-between">
                      <span className="font-medium">{protocol}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-base-300 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(count / statistics.totalFrames) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Region Distribution */}
            <div className="card bg-base-100 shadow-lg border border-base-300">
              <div className="card-body">
                <h2 className="card-title">区域分布</h2>
                <div className="space-y-3">
                  {getTopItems(statistics.regionDistribution).map(([region, count]) => (
                    <div key={region} className="flex items-center justify-between">
                      <span className="font-medium">{region}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-base-300 rounded-full h-2">
                          <div 
                            className="bg-secondary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(count / statistics.totalFrames) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Error Analysis */}
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body">
              <h2 className="card-title">错误分析</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getTopItems(statistics.errorTypes).map(([error, count]) => (
                  <div key={error} className="stat bg-error/10 rounded-lg">
                    <div className="stat-title text-error">{error}</div>
                    <div className="stat-value text-error text-lg">{count}</div>
                    <div className="stat-desc">
                      占错误总数 {((count / Object.values(statistics.errorTypes).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body">
              <h2 className="card-title">最近活动</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>时间</th>
                      <th>协议</th>
                      <th>区域</th>
                      <th>帧长</th>
                      <th>状态</th>
                      <th>错误信息</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.recentActivity.map((record) => (
                      <tr key={record.id}>
                        <td className="text-sm font-mono">
                          {formatTime(record.timestamp)}
                        </td>
                        <td>
                          <span className="badge badge-outline">{record.protocol}</span>
                        </td>
                        <td>{record.region}</td>
                        <td className="font-mono">{record.frameLength} 字节</td>
                        <td>
                          {record.success ? (
                            <span className="badge badge-success">成功</span>
                          ) : (
                            <span className="badge badge-error">失败</span>
                          )}
                        </td>
                        <td className="text-sm text-error">
                          {record.errorMessage || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body">
              <h2 className="card-title">数据管理</h2>
              <div className="flex gap-4">
                <button 
                  className="btn btn-primary"
                  onClick={exportData}
                >
                  导出数据
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={loadStatistics}
                  disabled={loading}
                >
                  刷新统计
                </button>
                <button 
                  className="btn btn-error btn-outline"
                  onClick={clearData}
                >
                  清空数据
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}