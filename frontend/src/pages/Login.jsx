import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { generateKeyPair } from '../utils/encryption';
import forge from 'node-forge';
import {
    Box,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Container,
    Stack,
    IconButton,
    Button,
    Fade,
    Divider
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Message as MessageIcon,
    Lock as LockIcon,
    Shield as ShieldIcon,
    Security as SecurityIcon,
    GppGood as GppGoodIcon
} from '@mui/icons-material';
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
            
            // 1. Get or Generate Keys
            let existingPrivateKey = localStorage.getItem('privateKey');
            let keys = null;

            if (existingPrivateKey) {
                try {
                    // Extract public key to ensure we always sync with server
                    const forgePriv = forge.pki.privateKeyFromPem(existingPrivateKey);
                    const forgePub = forge.pki.setRsaPublicKey(forgePriv.n, forgePriv.e);
                    keys = {
                        privateKey: existingPrivateKey,
                        publicKey: forge.pki.publicKeyToPem(forgePub)
                    };
                    console.log("Reusing existing security keys...");
                } catch (e) {
                    console.warn("Local keys corrupted, generating new ones...");
                    keys = await generateKeyPair();
                }
            } else {
                console.log("Generating fresh security keys...");
                keys = await generateKeyPair();
            }

            // 2. ALWAYS send public key to server to stay in sync
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

    const handleGoogleError = (err) => {
        console.error('Google OAuth error:', err);
        setError('Google sign-in was cancelled or failed. Please try again.');
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: handleGoogleError,
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
                background: `radial-gradient(circle at center, transparent 0%, rgba(4,7,18,0.85) 100%)`,
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

            <Container maxWidth="xs" sx={{ zIndex: 1 }}>
                <Fade in timeout={1000}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 4, md: 5 },
                            borderRadius: 6,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            background: 'rgba(13, 24, 46, 0.25)',
                            backdropFilter: 'blur(40px) saturate(200%)',
                            border: '1px solid rgba(0, 229, 255, 0.15)',
                            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.8)',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                borderColor: 'rgba(0, 229, 255, 0.4)',
                                boxShadow: '0 35px 80px -12px rgba(0, 229, 255, 0.2)',
                            }
                        }}
                    >
                        {/* Glowing Circular Icon Box */}
                        <Box
                            sx={{
                                width: 90,
                                height: 90,
                                borderRadius: '50%',
                                backgroundColor: 'rgba(0, 229, 255, 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid rgba(0, 229, 255, 0.5)',
                                boxShadow: '0 0 35px rgba(0, 229, 255, 0.4)',
                                mb: 3,
                                animation: 'glow-pulse 3s infinite ease-in-out',
                                '@keyframes glow-pulse': {
                                    '0%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)' },
                                    '50%': { boxShadow: '0 0 50px rgba(0, 229, 255, 0.6)' },
                                    '100%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)' },
                                }
                            }}
                        >
                            <MessageIcon
                                sx={{
                                    fontSize: 45,
                                    color: '#00e5ff',
                                    filter: 'drop-shadow(0 0 10px rgba(0,229,255,0.8))'
                                }}
                            />
                        </Box>

                        <Typography
                            variant="h3"
                            fontWeight="900"
                            gutterBottom
                            sx={{
                                color: 'white',
                                textShadow: '0 0 25px rgba(0,229,255,0.5)',
                                letterSpacing: '-1.5px',
                                mb: 0.5
                            }}
                        >
                            SecureChat
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'rgba(255,255,255,0.5)',
                                mb: 5,
                                letterSpacing: '3px',
                                textTransform: 'uppercase',
                                fontWeight: 700,
                                fontSize: '0.7rem'
                            }}
                        >
                            End-to-End Encryption
                        </Typography>

                        {error && (
                            <Fade in>
                                <Alert
                                    severity="error"
                                    sx={{
                                        width: '100%',
                                        mb: 3,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(211, 47, 47, 0.1)',
                                        color: '#ffcdd2',
                                        border: '1px solid #d32f2f'
                                    }}
                                >
                                    {error}
                                </Alert>
                            </Fade>
                        )}

                        {/* Custom Premium Google Button */}
                        <Box
                            onClick={!loading ? googleLogin : undefined}
                            sx={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 2,
                                py: 2,
                                borderRadius: 3,
                                bgcolor: 'white',
                                color: '#1a1a1a',
                                fontWeight: 800,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                '&:hover': {
                                    boxShadow: '0 15px 40px rgba(0,229,255,0.5)',
                                    transform: 'scale(1.02)',
                                },
                                '&:active': {
                                    transform: 'scale(0.98)',
                                }
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={24} sx={{ color: '#4285F4' }} />
                            ) : (
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                                    alt="Google"
                                    style={{ width: 24, height: 24 }}
                                />
                            )}
                            <span style={{ fontSize: '1rem' }}>{loading ? 'Authenticating...' : 'Sign in with Google'}</span>
                        </Box>

                        <Divider
                            sx={{
                                my: 5,
                                width: '100%',
                                '&::before, &::after': { borderColor: 'rgba(255,255,255,0.1)' }
                            }}
                        />

                        <Stack spacing={2.5} sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(0,229,255,0.1)', color: '#00e5ff' }}>
                                    <LockIcon fontSize="small" />
                                </Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                                    RSA-2048 &amp; AES-256 Protocol
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(0,229,255,0.1)', color: '#00e5ff' }}>
                                    <ShieldIcon fontSize="small" />
                                </Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                                    Privacy-First Identity Management
                                </Typography>
                            </Box>
                        </Stack>

                        <Box sx={{ mt: 5, width: '100%', textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                                Need a secure workspace?{' '}
                                <Button
                                    variant="text"
                                    size="small"
                                    sx={{
                                        p: 0,
                                        minWidth: 'auto',
                                        fontWeight: 800,
                                        color: '#00e5ff',
                                        fontSize: '0.85rem',
                                        '&:hover': { background: 'transparent', textDecoration: 'underline' }
                                    }}
                                    onClick={() => navigate('/register')}
                                >
                                    Join Network
                                </Button>
                            </Typography>
                        </Box>
                    </Paper>
                </Fade>

                <Box sx={{ mt: 6, textAlign: 'center' }}>
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'rgba(0,229,255,0.3)',
                            letterSpacing: '5px',
                            textTransform: 'uppercase',
                            fontWeight: 900,
                            fontSize: '0.65rem'
                        }}
                    >
                        The Future of Private Communication
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}

