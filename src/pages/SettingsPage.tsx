import { useState } from 'react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    theme: 'auto',
    language: 'zh-CN',
    autoSave: true,
    notifications: true,
    defaultRegion: '南网',
    maxHistoryItems: 100,
    enableDebugMode: false
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const themes = [
    { value: 'auto', label: '跟随系统' },
    { value: 'light', label: '浅色主题' },
    { value: 'dark', label: '深色主题' },
    { value: 'cupcake', label: '杯子蛋糕' },
    { value: 'bumblebee', label: '大黄蜂' },
    { value: 'emerald', label: '翡翠' },
    { value: 'corporate', label: '企业' },
    { value: 'synthwave', label: '合成波' },
    { value: 'retro', label: '复古' },
    { value: 'cyberpunk', label: '赛博朋克' },
    { value: 'valentine', label: '情人节' },
    { value: 'halloween', label: '万圣节' },
    { value: 'garden', label: '花园' },
    { value: 'forest', label: '森林' },
    { value: 'aqua', label: '水蓝' },
    { value: 'lofi', label: 'Lo-Fi' },
    { value: 'pastel', label: '粉彩' },
    { value: 'fantasy', label: '幻想' },
    { value: 'wireframe', label: '线框' },
    { value: 'black', label: '黑色' },
    { value: 'luxury', label: '奢华' },
    { value: 'dracula', label: '德古拉' },
    { value: 'cmyk', label: 'CMYK' },
    { value: 'autumn', label: '秋天' },
    { value: 'business', label: '商务' },
    { value: 'acid', label: '酸性' },
    { value: 'lemonade', label: '柠檬水' },
    { value: 'night', label: '夜晚' },
    { value: 'coffee', label: '咖啡' },
    { value: 'winter', label: '冬天' }
  ]

  const regions = ['南网', '国网', '广东', '广西', '云南', '贵州', '海南']

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">设置</h1>
        <p className="text-base-content/70">个性化您的使用体验</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 侧边导航 */}
        <div className="lg:col-span-1">
          <ul className="menu bg-base-100 rounded-box shadow-lg">
            <li className="menu-title">设置分类</li>
            <li><a className="active">外观设置</a></li>
            <li><a>解析设置</a></li>
            <li><a>数据管理</a></li>
            <li><a>高级设置</a></li>
            <li><a>关于</a></li>
          </ul>
        </div>

        {/* 主要设置内容 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 外观设置 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
                外观设置
              </h2>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">主题</span>
                </label>
                <select 
                  className="select select-bordered"
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                >
                  {themes.map(theme => (
                    <option key={theme.value} value={theme.value}>
                      {theme.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">语言</span>
                </label>
                <select 
                  className="select select-bordered"
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="zh-TW">繁体中文</option>
                  <option value="en-US">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* 解析设置 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                解析设置
              </h2>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">默认地区</span>
                </label>
                <select 
                  className="select select-bordered"
                  value={settings.defaultRegion}
                  onChange={(e) => handleSettingChange('defaultRegion', e.target.value)}
                >
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">自动保存解析结果</span>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-primary"
                    checked={settings.autoSave}
                    onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                  />
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">启用通知</span>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-primary"
                    checked={settings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 数据管理 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                数据管理
              </h2>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">最大历史记录数</span>
                </label>
                <input 
                  type="range" 
                  min="10" 
                  max="1000" 
                  value={settings.maxHistoryItems}
                  className="range range-primary"
                  onChange={(e) => handleSettingChange('maxHistoryItems', parseInt(e.target.value))}
                />
                <div className="w-full flex justify-between text-xs px-2">
                  <span>10</span>
                  <span className="font-semibold">{settings.maxHistoryItems}</span>
                  <span>1000</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="btn btn-outline btn-warning">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  清空历史记录
                </button>
                <button className="btn btn-outline btn-info">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  导出数据
                </button>
              </div>
            </div>
          </div>

          {/* 高级设置 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                高级设置
              </h2>
              
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">启用调试模式</span>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-warning"
                    checked={settings.enableDebugMode}
                    onChange={(e) => handleSettingChange('enableDebugMode', e.target.checked)}
                  />
                </label>
                <label className="label">
                  <span className="label-text-alt text-warning">
                    ⚠️ 调试模式会显示详细的日志信息，可能影响性能
                  </span>
                </label>
              </div>

              <div className="alert alert-info">
                <svg className="w-6 h-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <h3 className="font-bold">提示</h3>
                  <div className="text-xs">设置会自动保存到本地存储中</div>
                </div>
              </div>
            </div>
          </div>

          {/* 关于 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                关于
              </h2>
              
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">版本</div>
                  <div className="stat-value text-primary">v1.0.0</div>
                  <div className="stat-desc">基于 WASM 的协议解析器</div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="btn btn-outline btn-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  使用文档
                </button>
                <button className="btn btn-outline btn-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  更新日志
                </button>
                <button className="btn btn-outline btn-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  反馈问题
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}