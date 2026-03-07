import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { generateKeyPair } from '../utils/encryption';
import { Box, Typography, Paper, Alert, CircularProgress, Container, Stack, IconButton, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MessageIcon from '@mui/icons-material/Message';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Shield';
import { useGoogleLogin } from '@react-oauth/google';
import BackgroundVideo from '../components/BackgroundVideo';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSuccess = async (tokenResponse) => {
        setLoading(true);
        setError('');
        try {
            const accessToken = tokenResponse.access_token;
            if (!accessToken) throw new Error('No access token received from Google.');
            const keys = await generateKeyPair();
            const res = await authAPI.loginWithGoogle({
                token: accessToken,
                publicKey: keys.publicKey,
            });
            login(res.data.user, res.data.token, keys.privateKey);
            navigate('/chat');
        } catch (err) {
            console.error(err);
            const msg = err?.response?.data || 'Login failed. Please try again.';
            setError(typeof msg === 'string' ? msg : 'Authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: (err) => {
            console.error('Google OAuth error:', err);
            setError('Google sign-in was cancelled or failed. Please try again.');
        },
        flow: 'implicit',
        scope: 'email profile openid',
    });

    return (
        <Box
            sx={{
                display: 'flex',
                width: '100%',
                minHeight: '100vh',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
            }}
        >
            <BackgroundVideo />

            <IconButton
                onClick={() => navigate('/')}
                sx={{ position: 'absolute', top: 20, left: 20, color: 'primary.main', bgcolor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(5px)', '&:hover': { bgcolor: 'rgba(0,229,255,0.1)' } }}
            >
                <ArrowBackIcon />
            </IconButton>

            <Container maxWidth="xs">
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        background: 'rgba(13, 24, 46, 0.45)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        border: '1px solid rgba(0, 229, 255, 0.2)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                    }}
                >
                    <Box
                        sx={{
                            width: 80, height: 80, borderRadius: '50%',
                            backgroundColor: 'rgba(5, 10, 21, 0.6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 25px rgba(0,229,255,0.4)',
                            mb: 3, border: '1.5px solid #00e5ff',
                        }}
                    >
                        <MessageIcon
                            color="primary"
                            sx={{ fontSize: 40, filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.9))' }}
                        />
                    </Box>

                    <Typography
                        variant="h4"
                        fontWeight="bold"
                        gutterBottom
                        sx={{ textShadow: '0 0 15px rgba(0,229,255,0.4)', letterSpacing: '-0.5px' }}
                    >
                        SecureChat
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4 }}>
                        End-to-End Encrypted Messaging
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ width: '100%', mb: 3, borderRadius: 2, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#ffcdd2', border: '1px solid #d32f2f' }}>
                            {error}
                        </Alert>
                    )}

                    <Box
                        onClick={!loading ? googleLogin : undefined}
                        sx={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2,
                            py: 1.5,
                            borderRadius: 2,
                            bgcolor: '#fff',
                            color: '#3c4043',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s',
                            '&:hover': {
                                boxShadow: '0 0 20px rgba(0,229,255,0.6)',
                                transform: 'translateY(-2px)',
                            },
                        }}
                    >
                        {loading ? (
                            <CircularProgress size={22} sx={{ color: '#4285F4' }} />
                        ) : (
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                                alt="Google"
                                style={{ width: 22, height: 22 }}
                            />
                        )}
                        <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
                    </Box>

                    <Stack spacing={2} sx={{ mt: 5, width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <LockIcon color="primary" fontSize="small" />
                            <Typography variant="caption" color="text.secondary">
                                RSA-2048 &amp; AES-256 Encryption
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ShieldIcon color="primary" fontSize="small" />
                            <Typography variant="caption" color="text.secondary">
                                Private keys stay on your device
                            </Typography>
                        </Box>
                    </Stack>

                    <Box sx={{ mt: 4, width: '100%', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            Don't have an account?{' '}
                            <Button
                                variant="text"
                                size="small"
                                sx={{ p: 0, minWidth: 'auto', fontWeight: 600, color: 'primary.main', verticalAlign: 'baseline' }}
                                onClick={() => navigate('/register')}
                            >
                                Register Now
                            </Button>
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
