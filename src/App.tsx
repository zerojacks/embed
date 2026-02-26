import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import AnalysisPage from './pages/AnalysisPage'
import ToolsPage from './pages/ToolsPage'
import ConverterPage from './pages/tools/ConverterPage'
import ChecksumPage from './pages/tools/ChecksumPage'

function App() {
  return (
    <Router>
      <div className="h-screen overflow-hidden">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<AnalysisPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="tools/converter" element={<ConverterPage />} />
            <Route path="tools/checksum" element={<ChecksumPage />} />
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
  )
}

export default App