import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Typography, Button, Grid, Paper, Stack, Chip
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import BoltIcon from '@mui/icons-material/Bolt';
import GroupsIcon from '@mui/icons-material/Groups';
import ImageIcon from '@mui/icons-material/Image';
import ShieldIcon from '@mui/icons-material/Shield';
import KeyIcon from '@mui/icons-material/Key';
import MessageIcon from '@mui/icons-material/Message';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SecurityIcon from '@mui/icons-material/Security';
import BackgroundVideo from '../components/BackgroundVideo';

const FEATURES = [
    {
        icon: <LockIcon sx={{ fontSize: 32 }} />,
        title: 'End-to-End Encrypted',
        desc: 'Every message is encrypted with RSA-2048 + AES-256-GCM before it leaves your device.',
    },
    {
        icon: <BoltIcon sx={{ fontSize: 32 }} />,
        title: 'Real-Time Messaging',
        desc: 'Instant delivery via WebSockets with STOMP protocol. <100ms latency.',
    },
    {
        icon: <GroupsIcon sx={{ fontSize: 32 }} />,
        title: 'Group & Direct Chats',
        desc: 'Create one-on-one conversations or group channels with unbreakable encryption.',
    },
    {
        icon: <ImageIcon sx={{ fontSize: 32 }} />,
        title: 'Encrypted Media',
        desc: 'Photos, videos, and documents — all encrypted client-side before upload.',
    },
    {
        icon: <KeyIcon sx={{ fontSize: 32 }} />,
        title: 'Zero-Knowledge Keys',
        desc: 'Your private key is generated and stored ONLY on your device.',
    },
    {
        icon: <ShieldIcon sx={{ fontSize: 32 }} />,
        title: 'Google OAuth Login',
        desc: 'Secure, passwordless login with your Google account. No phone number required.',
    },
];

const STATS = [
    { value: 'RSA-2048', label: 'Key Exchange' },
    { value: 'AES-256', label: 'Encryption' },
    { value: '<100ms', label: 'Latency' },
    { value: '10k+', label: 'User Ready' },
];

export default function Welcome() {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: 'transparent',
                position: 'relative',
                overflowX: 'hidden',
            }}
        >
            <BackgroundVideo />

            {/* ── Nav ── */}
            <Box
                component="nav"
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    borderBottom: '1px solid rgba(0,229,255,0.1)',
                    backdropFilter: 'blur(20px)',
                    bgcolor: 'rgba(5,10,21,0.6)',
                    px: { xs: 2, md: 6 },
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <MessageIcon color="primary" sx={{ filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.8))' }} />
                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ textShadow: '0 0 10px rgba(0,229,255,0.4)', letterSpacing: '-0.3px' }}
                    >
                        SecureChat
                    </Typography>
                </Box>

                <Stack direction="row" spacing={2} alignItems="center">
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate('/login')}
                        sx={{ borderRadius: 6, px: 3, border: '1px solid rgba(0,229,255,0.4)', backdropFilter: 'blur(5px)' }}
                    >
                        Login
                    </Button>
                </Stack>
            </Box>

            {/* ── Hero Section ── */}
            <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 }, pb: 10, position: 'relative', zIndex: 1 }}>
                <Stack alignItems="center" textAlign="center" spacing={4}>

                    <Chip
                        icon={<SecurityIcon sx={{ fontSize: '14px !important' }} />}
                        label="Military-Grade Encryption"
                        sx={{
                            bgcolor: 'rgba(0,229,255,0.1)',
                            color: 'primary.main',
                            border: '1px solid rgba(0,229,255,0.3)',
                            fontWeight: 600,
                            backdropFilter: 'blur(10px)',
                        }}
                    />

                    <Box>
                        <Typography
                            variant="h1"
                            fontWeight={800}
                            sx={{
                                fontSize: { xs: '2.5rem', md: '4.5rem' },
                                lineHeight: 1.1,
                                background: 'linear-gradient(135deg, #ffffff 40%, #00e5ff 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                mb: 1,
                            }}
                        >
                            Privacy is not a feature.
                        </Typography>
                        <Typography
                            variant="h1"
                            fontWeight={800}
                            sx={{
                                fontSize: { xs: '2.5rem', md: '4.5rem' },
                                lineHeight: 1.1,
                                background: 'linear-gradient(90deg, #00e5ff, #7c4dff)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            It's a right.
                        </Typography>
                    </Box>

                    <Typography
                        variant="h6"
                        sx={{ maxWidth: 700, fontWeight: 400, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}
                    >
                        SecureChat uses end-to-end encryption to ensure only you and your recipient can read your messages.
                        Zero-knowledge architecture. Open-source soul.
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            size="large"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => navigate('/register')}
                            sx={{
                                px: 6, py: 2,
                                fontWeight: 800,
                                borderRadius: 3,
                                background: 'linear-gradient(90deg, #00e5ff, #0098dc)',
                                color: '#050a15',
                                boxShadow: '0 0 30px rgba(0,229,255,0.5)',
                                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 0 50px rgba(0,229,255,0.8)' },
                            }}
                        >
                            Start Chatting Now
                        </Button>
                    </Stack>

                    {/* Stats */}
                    <Grid container spacing={4} sx={{ mt: 6, maxWidth: 800 }}>
                        {STATS.map((s) => (
                            <Grid item xs={6} sm={3} key={s.label}>
                                <Typography variant="h4" fontWeight={800} color="primary" sx={{ textShadow: '0 0 10px rgba(0,229,255,0.5)' }}>{s.value}</Typography>
                                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Stack>

                {/* Features */}
                <Grid container spacing={3} sx={{ mt: 15 }}>
                    {FEATURES.map((f, i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Paper
                                sx={{
                                    p: 4, height: '100%',
                                    borderRadius: 4,
                                    background: 'rgba(13, 24, 46, 0.4)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(0,229,255,0.15)',
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                        border: '1px solid rgba(0,229,255,0.5)',
                                        transform: 'translateY(-5px)',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                    }
                                }}
                            >
                                <Box sx={{ color: 'primary.main', mb: 2 }}>{f.icon}</Box>
                                <Typography variant="h6" fontWeight={700} gutterBottom>{f.title}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{f.desc}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
}
