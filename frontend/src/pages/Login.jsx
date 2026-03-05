import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { generateKeyPair } from '../utils/encryption';
import { Box, Typography, Button, Paper, Alert, CircularProgress, Container, Stack } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Shield';
import MessageIcon from '@mui/icons-material/Message';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleTestLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        // In production we'd use @react-oauth/google.
        const fakeToken = "mock_google_token_" + Date.now();
        try {
            const keys = await generateKeyPair();
            const res = await authAPI.loginWithGoogle({ token: fakeToken, publicKey: keys.publicKey });

            login(res.data.user, res.data.token, keys.privateKey);
            navigate('/');
        } catch (err) {
            setError("Failed to login with Google");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <Container maxWidth="xs">
                <Paper elevation={12} sx={{ p: 4, borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    <Box sx={{
                        width: 64, height: 64, borderRadius: '50%', backgroundColor: 'background.default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 15px rgba(0,229,255,0.6)', mb: 3, border: '1px solid #00e5ff'
                    }}>
                        <MessageIcon color="primary" fontSize="large" sx={{ filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.8))' }} />
                    </Box>

                    <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ textShadow: '0 0 10px rgba(0,229,255,0.5)' }}>
                        SecureChat
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
                        End-to-End Encrypted Messaging
                    </Typography>

                    {error && <Alert severity="error" sx={{ width: '100%', mb: 3 }}>{error}</Alert>}

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleTestLogin}
                        disabled={loading}
                        sx={{ py: 1.5, my: 1, fontWeight: 'bold' }}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {loading ? 'Connecting...' : 'Continue with Google'}
                    </Button>

                    <Stack spacing={2} sx={{ mt: 5, width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <LockIcon color="primary" fontSize="small" sx={{ filter: 'drop-shadow(0 0 5px rgba(0,229,255,0.5))' }} />
                            <Typography variant="caption" color="text.secondary">
                                End-to-end encryption with RSA & AES-256
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ShieldIcon color="primary" fontSize="small" sx={{ filter: 'drop-shadow(0 0 5px rgba(0,229,255,0.5))' }} />
                            <Typography variant="caption" color="text.secondary">
                                Your private keys never leave your device
                            </Typography>
                        </Box>
                    </Stack>

                </Paper>
            </Container>
        </Box>
    );
}
