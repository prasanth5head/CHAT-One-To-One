import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Typography, Button, Grid, Paper, Stack, Chip, Avatar
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
import StorageIcon from '@mui/icons-material/Storage';

const FEATURES = [
    {
        icon: <LockIcon sx={{ fontSize: 32 }} />,
        title: 'End-to-End Encrypted',
        desc: 'Every message is encrypted with RSA-2048 + AES-256-GCM before it leaves your device. The server never sees plaintext.',
    },
    {
        icon: <BoltIcon sx={{ fontSize: 32 }} />,
        title: 'Real-Time Messaging',
        desc: 'Instant delivery via WebSockets with STOMP protocol. Typing indicators, read receipts, and <100ms latency.',
    },
    {
        icon: <GroupsIcon sx={{ fontSize: 32 }} />,
        title: 'Group & Direct Chats',
        desc: 'Create one-on-one conversations or group channels — all with the same unbreakable encryption.',
    },
    {
        icon: <ImageIcon sx={{ fontSize: 32 }} />,
        title: 'Encrypted Media',
        desc: 'Photos, videos, voice messages, and documents — all encrypted client-side before upload.',
    },
    {
        icon: <KeyIcon sx={{ fontSize: 32 }} />,
        title: 'Zero-Knowledge Keys',
        desc: 'Your private key is generated and stored only on your device. We are mathematically incapable of reading your messages.',
    },
    {
        icon: <ShieldIcon sx={{ fontSize: 32 }} />,
        title: 'Google OAuth Login',
        desc: 'Secure, passwordless login with your Google account. No phone number required — ever.',
    },
];

const STATS = [
    { value: 'RSA-2048', label: 'Key Exchange' },
    { value: 'AES-256', label: 'Encryption' },
    { value: '<100ms', label: 'Latency' },
    { value: '10k+', label: 'User Ready' },
];

// Animated glowing orb behind hero text
const GlowOrb = ({ size, top, left, color, opacity = 0.12 }) => (
    <Box
        sx={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            background: color,
            filter: 'blur(80px)',
            opacity,
            top,
            left,
            pointerEvents: 'none',
            zIndex: 0,
        }}
    />
);

export default function Welcome() {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: 'background.default',
                position: 'relative',
                overflowX: 'hidden',
            }}
        >
            {/* ── Ambient background orbs ── */}
            <GlowOrb size={600} top="-150px" left="-100px" color="#00e5ff" opacity={0.08} />
            <GlowOrb size={400} top="300px" left="65%" color="#7c4dff" opacity={0.1} />
            <GlowOrb size={350} top="70%" left="10%" color="#00e5ff" opacity={0.06} />

            {/* ── Nav ── */}
            <Box
                component="nav"
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    borderBottom: '1px solid rgba(0,229,255,0.1)',
                    backdropFilter: 'blur(16px)',
                    bgcolor: 'rgba(5,10,21,0.75)',
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
                    <Chip
                        label="Beta"
                        size="small"
                        sx={{
                            bgcolor: 'rgba(0,229,255,0.1)',
                            color: 'primary.main',
                            border: '1px solid rgba(0,229,255,0.3)',
                            fontWeight: 700,
                        }}
                    />
                    <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => navigate('/login')}
                        sx={{ borderRadius: 6, px: 3 }}
                    >
                        Login
                    </Button>
                </Stack>
            </Box>

            {/* ── Hero Section ── */}
            <Container maxWidth="lg" sx={{ pt: { xs: 10, md: 14 }, pb: 10, position: 'relative', zIndex: 1 }}>
                <Stack alignItems="center" textAlign="center" spacing={4}>

                    {/* Badge */}
                    <Chip
                        icon={<SecurityIcon sx={{ fontSize: '14px !important' }} />}
                        label="Production-Grade E2EE Messaging"
                        sx={{
                            bgcolor: 'rgba(0,229,255,0.08)',
                            color: 'primary.main',
                            border: '1px solid rgba(0,229,255,0.25)',
                            fontWeight: 600,
                            px: 1,
                            '& .MuiChip-icon': { color: 'primary.main' },
                        }}
                    />

                    {/* Headline */}
                    <Box>
                        <Typography
                            variant="h2"
                            fontWeight={800}
                            sx={{
                                fontSize: { xs: '2.4rem', md: '3.8rem' },
                                lineHeight: 1.15,
                                background: 'linear-gradient(135deg, #ffffff 40%, #00e5ff 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                mb: 0,
                            }}
                        >
                            Messages That Only
                        </Typography>
                        <Typography
                            variant="h2"
                            fontWeight={800}
                            sx={{
                                fontSize: { xs: '2.4rem', md: '3.8rem' },
                                lineHeight: 1.15,
                                background: 'linear-gradient(90deg, #00e5ff, #7c4dff)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            You Can Read.
                        </Typography>
                    </Box>

                    <Typography
                        variant="h6"
                        color="text.secondary"
                        sx={{ maxWidth: 600, fontWeight: 400, lineHeight: 1.7 }}
                    >
                        SecureChat uses end-to-end encryption — your private key never leaves your device.
                        Not even we can read your messages.
                    </Typography>

                    {/* CTA Buttons */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                        <Button
                            variant="contained"
                            size="large"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => navigate('/login')}
                            sx={{
                                px: 5, py: 1.6,
                                fontWeight: 700,
                                fontSize: '1rem',
                                borderRadius: 3,
                                background: 'linear-gradient(90deg, #00e5ff, #0098dc)',
                                color: '#050a15',
                                boxShadow: '0 0 20px rgba(0,229,255,0.4)',
                                '&:hover': {
                                    boxShadow: '0 0 40px rgba(0,229,255,0.7)',
                                    transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.3s',
                            }}
                        >
                            Get Started Free
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            size="large"
                            onClick={() => navigate('/login')}
                            sx={{ px: 5, py: 1.6, fontWeight: 700, fontSize: '1rem', borderRadius: 3 }}
                        >
                            Login
                        </Button>
                    </Stack>

                    {/* Stats Bar */}
                    <Stack
                        direction={{ xs: 'grid', sm: 'row' }}
                        spacing={0}
                        divider={<Box sx={{ width: '1px', bgcolor: 'rgba(0,229,255,0.15)', mx: 3, display: { xs: 'none', sm: 'block' } }} />}
                        sx={{
                            mt: 4,
                            p: { xs: 2, sm: 3 },
                            borderRadius: 3,
                            border: '1px solid rgba(0,229,255,0.15)',
                            bgcolor: 'rgba(13,24,46,0.6)',
                            backdropFilter: 'blur(10px)',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: { xs: 3, sm: 0 },
                        }}
                    >
                        {STATS.map((s) => (
                            <Box key={s.label} sx={{ textAlign: 'center', minWidth: 90 }}>
                                <Typography
                                    variant="h5"
                                    fontWeight={800}
                                    sx={{ color: '#00e5ff', textShadow: '0 0 10px rgba(0,229,255,0.5)', lineHeight: 1.2 }}
                                >
                                    {s.value}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                            </Box>
                        ))}
                    </Stack>
                </Stack>

                {/* ── Chat UI Preview ── */}
                <Box sx={{ mt: 10 }}>
                    <Paper
                        elevation={24}
                        sx={{
                            borderRadius: 4,
                            border: '1px solid rgba(0,229,255,0.2)',
                            boxShadow: '0 0 80px rgba(0,229,255,0.1), 0 40px 100px rgba(0,0,0,0.6)',
                            overflow: 'hidden',
                            maxWidth: 700,
                            mx: 'auto',
                        }}
                    >
                        {/* Fake titlebar */}
                        <Box
                            sx={{
                                bgcolor: '#0d182e',
                                px: 2.5, py: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                borderBottom: '1px solid rgba(0,229,255,0.1)',
                            }}
                        >
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff5f57' }} />
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#febc2e' }} />
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#28c840' }} />
                            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                <Chip
                                    icon={<LockIcon sx={{ fontSize: '12px !important' }} />}
                                    label="End-to-End Encrypted"
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(0,229,255,0.08)',
                                        color: 'primary.main',
                                        border: '1px solid rgba(0,229,255,0.25)',
                                        fontSize: '0.65rem',
                                        height: 20,
                                        '& .MuiChip-icon': { color: 'primary.main', fontSize: '10px' },
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Fake chat messages */}
                        <Box sx={{ p: 3, bgcolor: 'rgba(5,10,21,0.95)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {[
                                { mine: false, text: 'Hey! Did you see the audit report?', time: '10:31' },
                                { mine: true, text: 'Yes! All messages are encrypted 🔐', time: '10:32' },
                                { mine: false, text: 'Amazing. Even the server can\'t read this?', time: '10:32' },
                                { mine: true, text: 'Correct. Zero-knowledge by design ✅', time: '10:33' },
                            ].map((msg, i) => (
                                <Box key={i} sx={{ display: 'flex', justifyContent: msg.mine ? 'flex-end' : 'flex-start' }}>
                                    <Box
                                        sx={{
                                            maxWidth: '70%', p: 1.5, px: 2,
                                            bgcolor: msg.mine ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.06)',
                                            borderRadius: msg.mine ? '20px 20px 0 20px' : '20px 20px 20px 0',
                                            border: msg.mine
                                                ? '1px solid rgba(0,229,255,0.3)'
                                                : '1px solid rgba(255,255,255,0.08)',
                                            boxShadow: msg.mine ? '0 0 12px rgba(0,229,255,0.1)' : 'none',
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ color: '#e2f1ff' }}>{msg.text}</Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', display: 'block', mt: 0.5, textAlign: 'right' }}>
                                            {msg.time}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                            {/* Typing indicator */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <Box
                                    sx={{
                                        p: 1.5, px: 2.5,
                                        bgcolor: 'rgba(255,255,255,0.06)',
                                        borderRadius: '20px 20px 20px 0',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        display: 'flex', gap: 0.6, alignItems: 'center',
                                    }}
                                >
                                    {[0, 1, 2].map((d) => (
                                        <Box
                                            key={d}
                                            sx={{
                                                width: 7, height: 7, borderRadius: '50%', bgcolor: '#00e5ff',
                                                animation: 'bounce 1.2s infinite',
                                                animationDelay: `${d * 0.2}s`,
                                                '@keyframes bounce': {
                                                    '0%, 60%, 100%': { transform: 'translateY(0)', opacity: 0.4 },
                                                    '30%': { transform: 'translateY(-5px)', opacity: 1 },
                                                },
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                {/* ── Features Grid ── */}
                <Box sx={{ mt: 14 }}>
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        textAlign="center"
                        sx={{ mb: 2, background: 'linear-gradient(90deg, #fff, #00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                    >
                        Built for Security. Designed for People.
                    </Typography>
                    <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 7, maxWidth: 500, mx: 'auto' }}>
                        Every layer of SecureChat is engineered with privacy from the ground up.
                    </Typography>

                    <Grid container spacing={3}>
                        {FEATURES.map((f, i) => (
                            <Grid item xs={12} sm={6} md={4} key={i}>
                                <Paper
                                    elevation={4}
                                    sx={{
                                        p: 3, height: '100%',
                                        borderRadius: 3,
                                        border: '1px solid rgba(0,229,255,0.1)',
                                        bgcolor: 'rgba(13,24,46,0.7)',
                                        transition: 'all 0.3s',
                                        cursor: 'default',
                                        '&:hover': {
                                            border: '1px solid rgba(0,229,255,0.4)',
                                            boxShadow: '0 0 30px rgba(0,229,255,0.12)',
                                            transform: 'translateY(-4px)',
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 52, height: 52, borderRadius: 2,
                                            bgcolor: 'rgba(0,229,255,0.08)',
                                            border: '1px solid rgba(0,229,255,0.2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'primary.main',
                                            mb: 2,
                                            filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.3))',
                                        }}
                                    >
                                        {f.icon}
                                    </Box>
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                        {f.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                        {f.desc}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* ── CTA Banner ── */}
                <Paper
                    elevation={12}
                    sx={{
                        mt: 14, p: { xs: 4, md: 6 },
                        borderRadius: 4,
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, rgba(0,229,255,0.07) 0%, rgba(124,77,255,0.07) 100%)',
                        border: '1px solid rgba(0,229,255,0.2)',
                        boxShadow: '0 0 60px rgba(0,229,255,0.08)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <GlowOrb size={300} top="-80px" left="50%" color="#00e5ff" opacity={0.08} />
                    <LockIcon color="primary" sx={{ fontSize: 48, mb: 2, filter: 'drop-shadow(0 0 12px rgba(0,229,255,0.8))' }} />
                    <Typography variant="h4" fontWeight={800} gutterBottom sx={{ textShadow: '0 0 10px rgba(0,229,255,0.3)' }}>
                        Start Chatting Securely
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 460, mx: 'auto' }}>
                        Log in with your Google account in seconds. No phone number. No personal data stored in plaintext.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate('/login')}
                        sx={{
                            px: 6, py: 1.6,
                            fontWeight: 700,
                            fontSize: '1rem',
                            borderRadius: 3,
                            background: 'linear-gradient(90deg, #00e5ff, #0098dc)',
                            color: '#050a15',
                            boxShadow: '0 0 25px rgba(0,229,255,0.5)',
                            '&:hover': { boxShadow: '0 0 50px rgba(0,229,255,0.8)', transform: 'translateY(-2px)' },
                            transition: 'all 0.3s',
                        }}
                    >
                        Get Started Free
                    </Button>
                </Paper>

                {/* ── Footer ── */}
                <Box sx={{ mt: 10, mb: 4, textAlign: 'center', opacity: 0.4 }}>
                    <Typography variant="caption" color="text.secondary">
                        © 2026 SecureChat · Built with Spring Boot + React · Deployed on Render
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}
