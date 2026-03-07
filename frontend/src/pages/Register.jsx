import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Container, IconButton, Button, Stack, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';
import { useGoogleLogin } from '@react-oauth/google';
import BackgroundVideo from '../components/BackgroundVideo';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { generateKeyPair } from '../utils/encryption';
import { useState } from 'react';

export default function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleGoogleSuccess = async (tokenResponse) => {
        setLoading(true);
        try {
            const accessToken = tokenResponse.access_token;
            const keys = await generateKeyPair();
            const res = await authAPI.loginWithGoogle({
                token: accessToken,
                publicKey: keys.publicKey,
            });
            login(res.data.user, res.data.token, keys.privateKey);
            navigate('/chat');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        flow: 'implicit',
    });

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <BackgroundVideo />
            <IconButton
                onClick={() => navigate('/')}
                sx={{ position: 'absolute', top: 20, left: 20, color: 'primary.main', bgcolor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(5px)' }}
            >
                <ArrowBackIcon />
            </IconButton>

            <Container maxWidth="sm">
                <Paper
                    sx={{
                        p: 5,
                        borderRadius: 4,
                        background: 'rgba(13, 24, 46, 0.45)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(0, 229, 255, 0.2)',
                        textAlign: 'center',
                    }}
                >
                    <SecurityIcon color="primary" sx={{ fontSize: 60, mb: 2, filter: 'drop-shadow(0 0 10px rgba(0,229,255,0.6))' }} />
                    <Typography variant="h4" fontWeight="bold" gutterBottom>Join SecureChat</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        Create a decentralized identity in seconds. We use Google for authentication,
                        but your messages are encrypted with keys that only YOU control.
                    </Typography>

                    <Stack spacing={3} alignItems="center">
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            onClick={() => googleLogin()}
                            disabled={loading}
                            startIcon={
                                !loading && <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                                    alt="Google"
                                    style={{ width: 20, height: 20, marginRight: 8 }}
                                />
                            }
                            sx={{
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 700,
                                background: '#fff',
                                color: '#3c4043',
                                '&:hover': { background: '#f8f9fa', boxShadow: '0 0 20px rgba(0,229,255,0.4)' },
                            }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Sign up with Google'}
                        </Button>

                        <Typography variant="caption" color="text.secondary">
                            Already have an account?{' '}
                            <Button
                                variant="text"
                                size="small"
                                onClick={() => navigate('/login')}
                                sx={{ color: 'primary.main', fontWeight: 600 }}
                            >
                                Log in
                            </Button>
                        </Typography>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
