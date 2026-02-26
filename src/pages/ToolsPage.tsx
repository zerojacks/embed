import { Link } from 'react-router-dom'

const tools = [
  {
    id: 'converter',
    title: '进制转换',
    description: '十六进制、十进制、二进制转换',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    color: 'primary',
    status: 'available'
  },
  {
    id: 'checksum',
    title: '校验计算',
    description: 'CRC、校验和等计算工具',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'secondary',
    status: 'available'
  },
  {
    id: 'generator',
    title: '报文生成',
    description: '生成标准协议报文',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    color: 'accent',
    status: 'coming-soon'
  },
  {
    id: 'statistics',
    title: '数据统计',
    description: '解析结果统计分析',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'info',
    status: 'coming-soon'
  }
]

export default function ToolsPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 p-6 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">工具箱</h1>
            <p className="text-sm text-base-content/70 mt-1">
              协议分析和数据处理工具集合
            </p>
          </div>
          <div className="stats shadow-sm">
            <div className="stat py-2 px-4">
              <div className="stat-title text-xs">可用工具</div>
              <div className="stat-value text-lg">
                {tools.filter(t => t.status === 'available').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {tools.map((tool) => (
            <div key={tool.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300">
              <div className="card-body p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-${tool.color}/10 rounded-xl flex items-center justify-center text-${tool.color}`}>
                    {tool.icon}
                  </div>
                  <div className="badge badge-sm">
                    {tool.status === 'available' ? (
                      <span className="text-success">可用</span>
                    ) : (
                      <span className="text-warning">开发中</span>
                    )}
                  </div>
                </div>
                
                <h3 className="card-title text-lg mb-2">{tool.title}</h3>
                <p className="text-sm text-base-content/70 mb-4 flex-1">
                  {tool.description}
                </p>
                
                <div className="card-actions">
                  {tool.status === 'available' ? (
                    <Link 
                      to={`/tools/${tool.id}`}
                      className={`btn btn-${tool.color} btn-sm w-full`}
                    >
                      打开工具
                    </Link>
                  ) : (
                    <button className="btn btn-disabled btn-sm w-full">
                      敬请期待
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="max-w-6xl mx-auto mt-8">
          <h2 className="text-lg font-semibold mb-4">快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              to="/"
              className="card bg-linear-to-r from-primary to-secondary text-primary-content shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="card-body p-4">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold">快速解析</h3>
                    <p className="text-sm opacity-90">直接跳转到报文解析页面</p>
                  </div>
                </div>
              </div>
            </Link>
            
            <div className="card bg-linear-to-r from-accent to-info text-accent-content shadow-lg">
              <div className="card-body p-4">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <div>
                    <h3 className="font-semibold">使用指南</h3>
                    <p className="text-sm opacity-90">查看详细的使用说明</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}