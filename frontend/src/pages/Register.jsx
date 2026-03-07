import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Container,
    IconButton,
    Button,
    Stack,
    CircularProgress,
    Fade,
    Divider
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Security as SecurityIcon,
    VerifiedUser as VerifiedIcon,
    VpnKey as VpnKeyIcon,
    Public as PublicIcon
} from '@mui/icons-material';
import { useGoogleLogin } from '@react-oauth/google';
import BackgroundVideo from '../components/BackgroundVideo';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { generateKeyPair } from '../utils/encryption';

export default function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
            setError('Account creation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: (err) => {
            console.error('Google OAuth error:', err);
            setError('Google sign-up failed.');
        },
        flow: 'implicit',
    });

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                background: '#040712'
            }}
        >
            <BackgroundVideo />

            {/* Premium Radial Overlay */}
            <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle at center, transparent 0%, rgba(4,7,18,0.9) 100%)',
                zIndex: 0,
            }} />

            <IconButton
                onClick={() => navigate('/')}
                sx={{
                    position: 'absolute',
                    top: 24,
                    left: 24,
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 10,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
            >
                <ArrowBackIcon />
            </IconButton>

            <Container maxWidth="sm" sx={{ zIndex: 1 }}>
                <Fade in timeout={1200}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 4, md: 6 },
                            borderRadius: 6,
                            background: 'rgba(13, 24, 46, 0.25)',
                            backdropFilter: 'blur(50px) saturate(200%)',
                            border: '1px solid rgba(0, 229, 255, 0.15)',
                            textAlign: 'center',
                            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6)',
                            transition: 'all 0.4s ease',
                            '&:hover': {
                                borderColor: 'rgba(0, 229, 255, 0.3)',
                                boxShadow: '0 30px 70px rgba(0, 229, 255, 0.15)',
                            }
                        }}
                    >
                        {/* Glowing Header Icon */}
                        <Box sx={{
                            display: 'inline-flex',
                            p: 2.5,
                            mb: 3,
                            borderRadius: '24px',
                            background: 'rgba(0, 229, 255, 0.05)',
                            boxShadow: '0 0 40px rgba(0, 229, 255, 0.3)',
                            border: '1px solid rgba(0, 229, 255, 0.4)',
                        }}>
                            <SecurityIcon sx={{ fontSize: 50, color: '#00e5ff', filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.8))' }} />
                        </Box>

                        <Typography variant="h3" fontWeight="900" gutterBottom sx={{ color: 'white', letterSpacing: '-1px' }}>
                            Join the Network
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', mb: 5, maxWidth: 450, mx: 'auto', lineHeight: 1.7 }}>
                            Create a <span style={{ color: '#00e5ff', fontWeight: 700 }}>Decentralized Identity</span> in seconds.
                            We use Google for authentication, while ensuring your private keys never leave your device.
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ mb: 4, borderRadius: 2, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#ffcdd2', border: '1px solid #d32f2f' }}>
                                {error}
                            </Alert>
                        )}

                        <Stack spacing={4} alignItems="center">
                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                onClick={() => googleLogin()}
                                disabled={loading}
                                sx={{
                                    py: 2,
                                    fontSize: '1.1rem',
                                    fontWeight: 800,
                                    background: 'white',
                                    color: '#1a1a1a',
                                    borderRadius: 3,
                                    textTransform: 'none',
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                                    '&:hover': {
                                        background: '#f8f9fa',
                                        boxShadow: '0 15px 30px rgba(0,229,255,0.4)',
                                        transform: 'translateY(-2px)'
                                    },
                                    '&:active': { transform: 'translateY(1px)' }
                                }}
                                startIcon={
                                    !loading && <img
                                        src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                                        alt="Google"
                                        style={{ width: 24, height: 24, marginRight: 8 }}
                                    />
                                }
                            >
                                {loading ? <CircularProgress size={28} sx={{ color: '#4285F4' }} /> : 'Register with Google Cloud'}
                            </Button>

                            <Divider sx={{ width: '100%', borderColor: 'rgba(255,255,255,0.05)' }} />

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4, width: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <VpnKeyIcon sx={{ fontSize: 18, color: '#00e5ff' }} />
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Zero-Knowledge</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <VerifiedIcon sx={{ fontSize: 18, color: '#00e5ff' }} />
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>End-to-End Encrypted</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <PublicIcon sx={{ fontSize: 18, color: '#00e5ff' }} />
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>P2P Architecture</Typography>
                                </Box>
                            </Box>

                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                                Already have an account?{' '}
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => navigate('/login')}
                                    sx={{
                                        color: '#00e5ff',
                                        fontWeight: 800,
                                        '&:hover': { background: 'transparent', textDecoration: 'underline' }
                                    }}
                                >
                                    Log in here
                                </Button>
                            </Typography>
                        </Stack>
                    </Paper>
                </Fade>
            </Container>
        </Box>
    );
}

