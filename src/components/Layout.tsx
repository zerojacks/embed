import { Outlet, Link, useLocation } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function Layout() {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="navbar bg-base-100 border-b border-base-300 shrink-0 h-16">
        <div className="navbar-start">
          <Link to="/" className="flex items-center gap-3 hover:bg-base-200 rounded-lg p-2 transition-colors">
            <img src="/icon.svg" alt="Logo" className="w-8 h-8" />
            <div className="hidden sm:block">
              <div className="font-bold text-lg">协议解析器</div>
            </div>
          </Link>
        </div>

        <div className="navbar-center">
          <div className="tabs tabs-lifted">
            <Link
              to="/"
              className={`tab tab-lg gap-2 ${isActive('/') && location.pathname === '/' ? 'tab-active' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              解析
            </Link>
            {/* <Link
              to="/tools"
              className={`tab tab-lg gap-2 ${isActive('/tools') ? 'tab-active' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              工具
            </Link> */}
            <Link
              to="/config"
              className={`tab tab-lg gap-2 ${isActive('/config') ? 'tab-active' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              配置
            </Link>
          </div>
        </div>

        <div className="navbar-end gap-2">
          <Link 
            to="/feedback" 
            className="btn btn-ghost btn-sm gap-2"
            title="问题反馈"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">反馈</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}