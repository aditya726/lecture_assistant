import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Students from './pages/Students'
import AIChat from './pages/AIChat'
import Texts from './pages/Texts'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/students" element={<Students />} />
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/texts" element={<Texts />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
