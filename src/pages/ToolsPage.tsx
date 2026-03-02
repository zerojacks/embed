import { Link } from 'react-router-dom'

const tools = [
  {
    id: 'json',
    title: 'JSON 处理',
    description: 'JSON 格式化、压缩、验证和可视化',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7h-4V3" />
      </svg>
    ),
    color: 'primary',
    status: 'available'
  },
  {
    id: 'itemdata-parse',
    title: '数据项解析',
    description: '解析协议数据项的具体内容',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    color: 'success',
    status: 'available'
  },
  {
    id: 'converter',
    title: '编码转换',
    description: '十六进制、ASCII、Base64 等编码转换',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    color: 'secondary',
    status: 'available'
  },
  {
    id: 'timestamp',
    title: '时间戳工具',
    description: '时间戳转换、时间格式化和计算',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'accent',
    status: 'available'
  },
  {
    id: 'checksum',
    title: '校验计算',
    description: 'CRC、MD5、SHA 等校验和计算',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'info',
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
    color: 'warning',
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
    color: 'success',
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
            <div key={tool.id}>
              {tool.status === 'available' ? (
                <Link
                  to={`/tools/${tool.id}`}
                  className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300 cursor-pointer block"
                >
                  <div className="card-body p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-${tool.color}/10 rounded-xl flex items-center justify-center text-${tool.color}`}>
                        {tool.icon}
                      </div>
                      <div className="badge badge-sm">
                        <span className="text-success">可用</span>
                      </div>
                    </div>

                    <h3 className="card-title text-lg mb-2">{tool.title}</h3>
                    <p className="text-sm text-base-content/70 mb-4 flex-1">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="card bg-base-100 shadow-lg border border-base-300 opacity-60 cursor-not-allowed">
                  <div className="card-body p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-${tool.color}/10 rounded-xl flex items-center justify-center text-${tool.color}`}>
                        {tool.icon}
                      </div>
                      <div className="badge badge-sm">
                        <span className="text-warning">开发中</span>
                      </div>
                    </div>

                    <h3 className="card-title text-lg mb-2">{tool.title}</h3>
                    <p className="text-sm text-base-content/70 mb-4 flex-1">
                      {tool.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}