import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { SettingsProvider } from './contexts/SettingsContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import ProjectEditPage from './pages/ProjectEditPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <ProjectProvider>
            <div className="min-h-screen bg-white dark:bg-gray-900">
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/project/:projectId"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/project/:projectId/chat/:chatId"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/project/:projectId/edit"
                  element={
                    <ProtectedRoute>
                      <ProjectEditPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/project/:projectId/knowledge"
                  element={
                    <ProtectedRoute>
                      <KnowledgeBasePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/project/:projectId/system-prompt"
                  element={
                    <ProtectedRoute>
                      <ProjectEditPage />
                    </ProtectedRoute>
                  }
                />
                {/* Catch-all route for invalid URLs */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </ProjectProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;