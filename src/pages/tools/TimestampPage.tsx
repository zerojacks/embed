import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Clock, Globe, MapPin, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TimestampPage() {
  const [timestamp, setTimestamp] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedTimezone, setSelectedTimezone] = useState('UTC')

  // 常用时区列表
  const timezones = [
    { value: 'UTC', label: 'UTC (协调世界时)', flag: '🌍' },
    { value: 'Asia/Shanghai', label: '北京时间 (GMT+8)', flag: '🇨🇳' },
    { value: 'America/New_York', label: '纽约时间 (EST/EDT)', flag: '🇺🇸' },
    { value: 'America/Los_Angeles', label: '洛杉矶时间 (PST/PDT)', flag: '🇺🇸' },
    { value: 'Europe/London', label: '伦敦时间 (GMT/BST)', flag: '🇬🇧' },
    { value: 'Europe/Paris', label: '巴黎时间 (CET/CEST)', flag: '🇫🇷' },
    { value: 'Asia/Tokyo', label: '东京时间 (JST)', flag: '🇯🇵' },
    { value: 'Asia/Seoul', label: '首尔时间 (KST)', flag: '🇰🇷' },
    { value: 'Australia/Sydney', label: '悉尼时间 (AEST/AEDT)', flag: '🇦🇺' },
    { value: 'Asia/Dubai', label: '迪拜时间 (GST)', flag: '🇦🇪' }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000) // 恢复每秒更新一次
    return () => clearInterval(timer)
  }, [])

  // 实时转换时间戳到日期
  useEffect(() => {
    if (timestamp.trim()) {
      try {
        const ts = parseInt(timestamp)
        if (!isNaN(ts)) {
          // 判断是秒级还是毫秒级时间戳
          const date = ts.toString().length === 10 ? new Date(ts * 1000) : new Date(ts)

          if (!isNaN(date.getTime())) {
            setDateTime(formatDateInTimezone(date, selectedTimezone))
          } else {
            setDateTime('')
          }
        } else {
          setDateTime('')
        }
      } catch (error) {
        setDateTime('')
      }
    } else {
      setDateTime('')
    }
  }, [timestamp, selectedTimezone])

  // 实时转换日期到时间戳
  useEffect(() => {
    if (dateTime.trim() && !timestamp.trim()) {
      try {
        const date = new Date(dateTime)
        if (!isNaN(date.getTime())) {
          setTimestamp(Math.floor(date.getTime() / 1000).toString())
        }
      } catch (error) {
        // 忽略转换错误
      }
    }
  }, [dateTime])

  const formatDateInTimezone = (date: Date, timezone: string) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: timezone
    })
  }

  const getCurrentTimestamp = () => {
    const now = Math.floor(Date.now() / 1000)
    setTimestamp(now.toString())
    toast.success('已获取当前时间戳')
  }

  const getCurrentDateTime = () => {
    const now = formatDateInTimezone(new Date(), selectedTimezone)
    setDateTime(now)
    toast.success('已获取当前时间')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('已复制到剪贴板')
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 p-6 border-b border-base-300">
        <div className="flex items-center gap-4">
          <Link to="/tools" className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center justify-between flex-1">
            <div>
              <h1 className="text-2xl font-bold">时间戳工具</h1>
              <p className="text-sm text-base-content/70 mt-1">
                时间戳转换、时间格式化和计算
              </p>
            </div>
            <div className="stats shadow-sm">
              <div className="stat py-2 px-4">
                <div className="stat-title text-xs">当前时间</div>
                <div className="stat-value text-sm font-mono">
                  {currentTime.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Compact Current Time & Timezone Selector */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Timezone Selector */}
            <div className="flex-1 card bg-base-100 shadow border border-base-300">
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">时区选择</span>
                </div>
                <select
                  className="select select-bordered select-sm w-full"
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.flag} {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compact Current Time */}
            <div className="flex-1 card bg-linear-to-r from-primary/10 to-secondary/10 border border-base-300">
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">当前时间戳</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="text-xs text-base-content/60">秒级</div>
                    <div className="font-mono text-sm font-bold">
                      {Math.floor(currentTime.getTime() / 1000)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-base-content/60">毫秒级</div>
                    <div className="font-mono text-sm font-bold">
                      {currentTime.getTime()}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      className="btn btn-xs btn-outline"
                      onClick={() => copyToClipboard(Math.floor(currentTime.getTime() / 1000).toString())}
                    >
                      复制秒
                    </button>
                    <button
                      className="btn btn-xs btn-outline"
                      onClick={() => copyToClipboard(currentTime.getTime().toString())}
                    >
                      复制毫秒
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Timezone Reference */}
          <div className="card bg-base-100 shadow border border-base-300">
            <div className="card-body p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">主要时区当前时间</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {timezones.slice(0, 6).map((tz) => (
                  <div key={tz.value} className="text-center p-3 bg-base-200 rounded">
                    <div className="text-xs text-base-content/60 flex items-center justify-center gap-1 mb-1">
                      <span>{tz.flag}</span>
                      <span>{tz.label.split(' ')[0]}</span>
                    </div>
                    <div className="font-mono text-xs font-bold">
                      {formatDateInTimezone(currentTime, tz.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timestamp to Date */}
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body">
              <h2 className="card-title">时间戳转日期 <span className="text-sm font-normal text-base-content/60">(支持秒级和毫秒级)</span></h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">时间戳</span>
                  </label>
                  <div className="join">
                    <input
                      type="text"
                      className="input input-bordered join-item flex-1 font-mono"
                      placeholder="请输入时间戳..."
                      value={timestamp}
                      onChange={(e) => setTimestamp(e.target.value)}
                    />
                    <button
                      className="btn btn-outline join-item"
                      onClick={getCurrentTimestamp}
                    >
                      当前
                    </button>
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">转换结果</span>
                  </label>
                  <div className="join">
                    <input
                      type="text"
                      className="input input-bordered join-item flex-1"
                      placeholder="转换结果将显示在这里..."
                      value={dateTime}
                      readOnly
                    />
                    <button
                      className="btn btn-outline join-item"
                      onClick={() => copyToClipboard(dateTime)}
                      disabled={!dateTime}
                    >
                      复制
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Date to Timestamp */}
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body">
              <h2 className="card-title">日期转时间戳</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">日期时间</span>
                  </label>
                  <div className="join">
                    <input
                      type="datetime-local"
                      className="input input-bordered join-item flex-1"
                      value={dateTime.replace(/(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})/, '$1-$2-$3T$4:$5:$6')}
                      onChange={(e) => {
                        const date = new Date(e.target.value)
                        setDateTime(date.toLocaleString('zh-CN'))
                      }}
                    />
                    <button
                      className="btn btn-outline join-item"
                      onClick={getCurrentDateTime}
                    >
                      当前
                    </button>
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">时间戳 (秒)</span>
                  </label>
                  <div className="join">
                    <input
                      type="text"
                      className="input input-bordered join-item flex-1 font-mono"
                      placeholder="转换结果将显示在这里..."
                      value={timestamp}
                      readOnly
                    />
                    <button
                      className="btn btn-outline join-item"
                      onClick={() => copyToClipboard(timestamp)}
                      disabled={!timestamp}
                    >
                      复制
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body">
              <h2 className="card-title">常用时间戳</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: '今天 00:00',
                    value: () => {
                      // 获取选定时区的今天00:00时间戳
                      const now = new Date()
                      // 获取选定时区的当前时间
                      const nowInTimezone = new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone }))
                      // 构造该时区今天的00:00
                      const todayMidnight = new Date(nowInTimezone.getFullYear(), nowInTimezone.getMonth(), nowInTimezone.getDate())
                      // 计算时区偏移并调整
                      const timezoneOffset = now.getTime() - new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone })).getTime()
                      return Math.floor((todayMidnight.getTime() + timezoneOffset) / 1000)
                    }
                  },
                  {
                    label: '昨天 00:00',
                    value: () => {
                      // 获取选定时区的昨天00:00时间戳
                      const now = new Date()
                      const nowInTimezone = new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone }))
                      const yesterdayMidnight = new Date(nowInTimezone.getFullYear(), nowInTimezone.getMonth(), nowInTimezone.getDate() - 1)
                      const timezoneOffset = now.getTime() - new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone })).getTime()
                      return Math.floor((yesterdayMidnight.getTime() + timezoneOffset) / 1000)
                    }
                  },
                  {
                    label: '本周一 00:00',
                    value: () => {
                      // 获取选定时区的本周一00:00时间戳
                      const now = new Date()
                      const nowInTimezone = new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone }))
                      const currentDay = nowInTimezone.getDay()
                      const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay
                      const mondayMidnight = new Date(nowInTimezone.getFullYear(), nowInTimezone.getMonth(), nowInTimezone.getDate() + daysToMonday)
                      const timezoneOffset = now.getTime() - new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone })).getTime()
                      return Math.floor((mondayMidnight.getTime() + timezoneOffset) / 1000)
                    }
                  },
                  {
                    label: '本月 1 日 00:00',
                    value: () => {
                      // 获取选定时区的本月1日00:00时间戳
                      const now = new Date()
                      const nowInTimezone = new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone }))
                      const firstDayMidnight = new Date(nowInTimezone.getFullYear(), nowInTimezone.getMonth(), 1)
                      const timezoneOffset = now.getTime() - new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone })).getTime()
                      return Math.floor((firstDayMidnight.getTime() + timezoneOffset) / 1000)
                    }
                  }
                ].map((item, index) => (
                  <button
                    key={index}
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      const ts = item.value()
                      setTimestamp(ts.toString())
                      const date = new Date(ts * 1000)
                      setDateTime(formatDateInTimezone(date, selectedTimezone))
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}