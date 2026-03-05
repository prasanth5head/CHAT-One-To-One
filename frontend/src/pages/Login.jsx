import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { generateKeyPair } from '../utils/encryption';
import { Box, Typography, Paper, Alert, CircularProgress, Container, Stack, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Shield';
import MessageIcon from '@mui/icons-material/Message';
import { useGoogleLogin } from '@react-oauth/google';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    // Called after user successfully picks their Google account in the popup.
    // With flow:'implicit', tokenResponse contains { access_token, ... } — NOT credential.
    // We send the access_token to the backend which calls Google's userinfo endpoint.
    const handleGoogleSuccess = async (tokenResponse) => {
        setLoading(true);
        setError('');
        try {
            const accessToken = tokenResponse.access_token;

            if (!accessToken) throw new Error('No access token received from Google.');

            // Generate RSA-2048 key pair client-side — private key NEVER leaves the browser
            const keys = await generateKeyPair();

            // Send access_token + public key to backend
            const res = await authAPI.loginWithGoogle({
                token: accessToken,
                publicKey: keys.publicKey,
            });

            // Persist JWT, user, and private key locally
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

    // useGoogleLogin (implicit flow) opens a Google popup and returns an access_token
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
                p: 2,
                // Subtle radial glow background
                background: 'radial-gradient(ellipse at 50% 50%, rgba(0,229,255,0.06) 0%, #050a15 70%)',
                position: 'relative',
            }}
        >
            {/* Back to Welcome */}
            <IconButton
                onClick={() => navigate('/')}
                sx={{ position: 'absolute', top: 20, left: 20, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
                <ArrowBackIcon />
            </IconButton>
            <Container maxWidth="xs">
                <Paper
                    elevation={12}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        border: '1px solid rgba(0,229,255,0.2)',
                        boxShadow: '0 0 40px rgba(0,229,255,0.08)',
                    }}
                >
                    {/* Icon */}
                    <Box
                        sx={{
                            width: 72, height: 72, borderRadius: '50%',
                            backgroundColor: 'background.default',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(0,229,255,0.6), inset 0 0 20px rgba(0,229,255,0.05)',
                            mb: 3, border: '1.5px solid #00e5ff',
                        }}
                    >
                        <MessageIcon
                            color="primary"
                            sx={{ fontSize: 36, filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.9))' }}
                        />
                    </Box>

                    <Typography
                        variant="h4"
                        fontWeight="bold"
                        gutterBottom
                        sx={{ textShadow: '0 0 14px rgba(0,229,255,0.5)', letterSpacing: '-0.5px' }}
                    >
                        SecureChat
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
                        End-to-End Encrypted Messaging
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ width: '100%', mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Google Login Button */}
                    <Box
                        onClick={!loading ? googleLogin : undefined}
                        sx={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2,
                            py: 1.4,
                            px: 3,
                            borderRadius: 2,
                            bgcolor: '#fff',
                            color: '#3c4043',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'box-shadow 0.3s, transform 0.2s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            '&:hover': {
                                boxShadow: loading ? undefined : '0 0 20px rgba(0,229,255,0.5)',
                                transform: loading ? undefined : 'translateY(-1px)',
                            },
                        }}
                    >
                        {loading ? (
                            <CircularProgress size={22} sx={{ color: '#4285F4' }} />
                        ) : (
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google"
                                style={{ width: 22, height: 22 }}
                            />
                        )}
                        <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
                    </Box>

                    {/* Security info */}
                    <Stack spacing={2} sx={{ mt: 5, width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <LockIcon
                                color="primary"
                                fontSize="small"
                                sx={{ filter: 'drop-shadow(0 0 5px rgba(0,229,255,0.5))' }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                End-to-end encryption with RSA-2048 &amp; AES-256
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ShieldIcon
                                color="primary"
                                fontSize="small"
                                sx={{ filter: 'drop-shadow(0 0 5px rgba(0,229,255,0.5))' }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                Your private key never leaves your device
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
