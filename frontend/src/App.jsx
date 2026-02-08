import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import AIChat from './pages/AIChat';
import AISummarize from './pages/AISummarize';
import AIExplain from './pages/AIExplain';
import AITopics from './pages/AITopics';
import AIKeywords from './pages/AIKeywords';
import AIDifficulty from './pages/AIDifficulty';
import Texts from './pages/Texts';
import Login from './pages/Login';
import Register from './pages/Register';
import GoogleCallback from './pages/GoogleCallback';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Layout>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<GoogleCallback />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/ai-chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
            <Route path="/ai-summarize" element={<ProtectedRoute><AISummarize /></ProtectedRoute>} />
            <Route path="/ai-explain" element={<ProtectedRoute><AIExplain /></ProtectedRoute>} />
            <Route path="/ai-topics" element={<ProtectedRoute><AITopics /></ProtectedRoute>} />
            <Route path="/ai-keywords" element={<ProtectedRoute><AIKeywords /></ProtectedRoute>} />
            <Route path="/ai-difficulty" element={<ProtectedRoute><AIDifficulty /></ProtectedRoute>} />
            <Route path="/texts" element={<ProtectedRoute><Texts /></ProtectedRoute>} />
            </Routes>
          </Layout>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
