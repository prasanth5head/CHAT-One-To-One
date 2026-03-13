import { Box } from '@mui/material';
import introVideo from '../assets/Intro.mp4';

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
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(5, 10, 21, 0.75)', // Dark overlay
                    background: 'radial-gradient(circle, rgba(5,10,21,0.4) 0%, rgba(5,10,21,0.9) 100%)',
                }
            }}
        >
            <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}
            >
                <source src={introVideo} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </Box>
    );
}
