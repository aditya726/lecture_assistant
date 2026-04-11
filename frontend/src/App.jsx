import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { PublicOnlyRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import Notes from './pages/Notes';
import Login from './pages/Login';
import Register from './pages/Register';
import GoogleCallback from './pages/GoogleCallback';
import LandingPage from './pages/LandingPage';
import Scanner from './pages/Scanner';
import { Toaster } from 'sonner';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
              <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
              <Route path="/auth/callback" element={<GoogleCallback />} />
              <Route path="/" element={<LandingPage />} />
              <Route path="/workspace" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
              <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
            </Routes>
          </Layout>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
