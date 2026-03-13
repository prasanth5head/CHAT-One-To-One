import { Box } from '@mui/material';

export default function BackgroundVideo() {
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                overflow: 'hidden',
                background: '#050a15',
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at center, rgba(0,229,255,0.08) 0%, rgba(5,10,21,1) 100%)',
                }
            }}
        />
    );
}
