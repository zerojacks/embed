import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { WasmProvider } from './contexts/WasmContext'
import { initializeTheme } from './stores/useThemeStore'
import Layout from './components/Layout'
import AnalysisPage from './pages/AnalysisPage'
import ToolsPage from './pages/ToolsPage'
import ConfigPage from './pages/ConfigPage'
import FeedbackPage from './pages/FeedbackPage'
import JsonToolPage from './pages/tools/JsonToolPage'
import ConverterPage from './pages/tools/ConverterPage'
import TimestampPage from './pages/tools/TimestampPage'
import ChecksumPage from './pages/tools/ChecksumPage'
import GeneratorPage from './pages/tools/GeneratorPage'
import StatisticsPage from './pages/tools/StatisticsPage'
import ItemdataPrasePage from './pages/tools/ItemdataPrasePage'

function App() {
  useEffect(() => {
    // 初始化主题系统
    const cleanup = initializeTheme()
    return cleanup
  }, [])

  return (
    <WasmProvider region="南网">
      <Router>
        <div className="h-screen overflow-hidden">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<AnalysisPage />} />
              <Route path="tools" element={<ToolsPage />} />
              <Route path="tools/json" element={<JsonToolPage />} />
              <Route path="tools/converter" element={<ConverterPage />} />
              <Route path="tools/timestamp" element={<TimestampPage />} />
              <Route path="tools/checksum" element={<ChecksumPage />} />
              <Route path="tools/generator" element={<GeneratorPage />} />
              <Route path="tools/statistics" element={<StatisticsPage />} />
              <Route path="tools/itemdata-parse" element={<ItemdataPrasePage />} />
              <Route path="config" element={<ConfigPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
            </Route>
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--fallback-b1,oklch(var(--b1)))',
                color: 'var(--fallback-bc,oklch(var(--bc)))',
              },
            }}
          />
        </div>
      </Router>
    </WasmProvider>
  )
}

export default App