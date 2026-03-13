import { useState, useEffect } from 'react';
import { Box, Button, Typography, Slide, IconButton } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';

export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Only show if not dismissed before
            const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
            if (!dismissed) setShowBanner(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBanner(false);
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        sessionStorage.setItem('pwa-banner-dismissed', '1');
    };

    return (
        <Slide direction="up" in={showBanner} mountOnEnter unmountOnExit>
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    width: { xs: 'calc(100vw - 32px)', sm: 420 },
                    bgcolor: 'rgba(13, 24, 46, 0.96)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 229, 255, 0.3)',
                    borderRadius: 4,
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(0,229,255,0.1)',
                }}
            >
                {/* App Icon */}
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2.5,
                        bgcolor: 'rgba(0,229,255,0.1)',
                        border: '1px solid rgba(0,229,255,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <PhoneIphoneIcon sx={{ color: '#00e5ff', fontSize: 28 }} />
                </Box>

                {/* Text */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        sx={{ color: 'white', lineHeight: 1.3 }}
                    >
                        Install SecureChat
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}
                    >
                        Add to home screen for the best experience
                    </Typography>
                </Box>

                {/* Install button */}
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<GetAppIcon />}
                    onClick={handleInstall}
                    sx={{
                        bgcolor: '#00e5ff',
                        color: '#040712',
                        fontWeight: 800,
                        borderRadius: 2,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        '&:hover': { bgcolor: '#4dfaff' },
                    }}
                >
                    Install
                </Button>

                {/* Dismiss */}
                <IconButton
                    size="small"
                    onClick={handleDismiss}
                    sx={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
        </Slide>
    );
}
