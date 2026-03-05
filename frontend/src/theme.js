import { createTheme } from '@mui/material/styles';

const glowingTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#00e5ff', // Cyberpunk cyan glowing
        },
        secondary: {
            main: '#f50057',
        },
        background: {
            default: '#050a15',
            paper: '#0d182e',
        },
        text: {
            primary: '#e2f1ff',
            secondary: '#7b92b5',
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    boxShadow: '0 0 10px rgba(0, 229, 255, 0.4)',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        boxShadow: '0 0 20px rgba(0, 229, 255, 0.8), 0 0 40px rgba(0, 229, 255, 0.4)',
                        backgroundColor: 'rgba(0, 229, 255, 0.1)',
                    }
                },
                contained: {
                    color: '#050a15',
                    backgroundColor: '#00e5ff',
                    '&:hover': {
                        backgroundColor: '#33ebff',
                    }
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    boxShadow: '0 0 15px rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(0, 229, 255, 0.1)',
                }
            }
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: 'rgba(0, 229, 255, 0.3)',
                            transition: 'all 0.3s ease',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(0, 229, 255, 0.6)',
                            boxShadow: '0 0 8px rgba(0, 229, 255, 0.2)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#00e5ff',
                            boxShadow: '0 0 15px rgba(0, 229, 255, 0.5)',
                        },
                    },
                }
            }
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    boxShadow: '0 0 10px rgba(0, 229, 255, 0.5)',
                    border: '2px solid rgba(0, 229, 255, 0.8)',
                }
            }
        }
    }
});

export default glowingTheme;
