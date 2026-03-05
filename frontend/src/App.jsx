import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Login from './pages/Login';
import ChatPage from './pages/ChatPage';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import glowingTheme from './theme';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <CircularProgress color="primary" />
    </Box>
  );

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider theme={glowingTheme}>
      <CssBaseline />
      <AuthProvider>
        <ChatProvider>
          <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <ChatPage />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </Box>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
