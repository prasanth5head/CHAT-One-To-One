import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Login from './pages/Login';
import ChatPage from './pages/ChatPage';
import { useState, useEffect } from 'react';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;

  return user ? children : <Navigate to="/login" />;
};

function App() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <AuthProvider>
      <ChatProvider>
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <ChatPage toggleTheme={toggleTheme} theme={theme} />
                  </PrivateRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </div>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
