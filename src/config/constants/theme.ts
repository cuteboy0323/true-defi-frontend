import { ThemeOptions } from '@mui/material';

export const light: ThemeOptions = {
    palette: {
        mode: 'light',
        primary: {
            main: '#d81384'
        },
        secondary: {
            main: '#313cad'
        },
        error: {
            main: '#db084e'
        },
        background: {
            paper: '#ffffff',
            default: '#f4edf1'
        }
    },
    typography: {
        fontFamily: "'Poppins', cursive",
        fontSize: 14
    },
    shape: {
        borderRadius: 6
    },
    components: {
        MuiInputAdornment: {
            styleOverrides: {
                root: {
                    marginRight: 8
                }
            }
        },
        MuiInputBase: {
            styleOverrides: {
                root: {
                    '& input': {
                        paddingTop: 16,
                        paddingBottom: 16,
                        paddingLeft: 24,
                        paddingRight: 24,
                        fontSize: 16
                    },
                    '& select': {
                        paddingTop: 16,
                        paddingBottom: 16,
                        paddingLeft: 24,
                        paddingRight: 24,
                        fontSize: 16
                    }
                },
                sizeSmall: {
                    '& input': {
                        paddingTop: 8,
                        paddingBottom: 8,
                        paddingLeft: 16,
                        paddingRight: 16,
                        fontSize: 14
                    },
                    '& select': {
                        paddingTop: 8,
                        paddingBottom: 8,
                        paddingLeft: 16,
                        paddingRight: 16,
                        fontSize: 14
                    }
                }
            }
        },
        MuiFilledInput: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(85, 119, 253, 0.1)',
                    borderRadius: 8,
                    '&:before': {
                        content: 'none'
                    },
                    '&:after': {
                        content: 'none'
                    }
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none'
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                sizeSmall: {
                    padding: '4px 4px'
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: '#ffffff99',
                    backgroundImage: 'none',
                    boxShadow: '6px 2px 12px 0px rgba(0, 0, 0, 0.1)'
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    '&.MuiButton-containedPrimary': {
                        backgroundSize: '100% 200%',
                        backgroundImage:
                            'linear-gradient(180deg,#2b38a3,#655afd 49.45%,#665afe 50%,#655afd 50.55%,#2b38a3)',
                        transition: '0.4s',
                        '&:hover': {
                            backgroundPositionY: '98%'
                        },
                        '&.Mui-disabled': {
                            backgroundImage: 'none'
                        }
                    }
                }
            }
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    borderRadius: 6
                }
            }
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 6
                }
            }
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 6
                }
            }
        },
        MuiBackdrop: {
            styleOverrides: {
                root: {
                    backdropFilter: 'blur(5px)'
                }
            }
        }
    }
};

export const dark: ThemeOptions = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#d81384'
        },
        secondary: {
            main: '#313cad'
        },
        error: {
            main: '#db084e'
        },
        background: {
            paper: '#0e1031',
            default: '#070c38'
        }
    },
    typography: {
        fontFamily: "'Poppins', cursive",
        fontSize: 14
    },
    shape: {
        borderRadius: 6
    },
    components: {
        MuiInputAdornment: {
            styleOverrides: {
                root: {
                    marginRight: 8
                }
            }
        },
        MuiInputBase: {
            styleOverrides: {
                root: {
                    '& input': {
                        paddingTop: 16,
                        paddingBottom: 16,
                        paddingLeft: 24,
                        paddingRight: 24,
                        fontSize: 16
                    },
                    '& select': {
                        paddingTop: 16,
                        paddingBottom: 16,
                        paddingLeft: 24,
                        paddingRight: 24,
                        fontSize: 16
                    }
                },
                sizeSmall: {
                    '& input': {
                        paddingTop: 8,
                        paddingBottom: 8,
                        paddingLeft: 16,
                        paddingRight: 16,
                        fontSize: 14
                    },
                    '& select': {
                        paddingTop: 8,
                        paddingBottom: 8,
                        paddingLeft: 16,
                        paddingRight: 16,
                        fontSize: 14
                    }
                }
            }
        },
        MuiFilledInput: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(85, 119, 253, 0.1)',
                    borderRadius: 8,
                    '&:before': {
                        content: 'none'
                    },
                    '&:after': {
                        content: 'none'
                    }
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none'
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                sizeSmall: {
                    padding: '0px 6px',
                    height: 26
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: '#070c3899',
                    backgroundImage: 'none',
                    boxShadow: '5px 8px 16px rgb(0 0 0 / 5%)'
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    '&.MuiButton-containedPrimary': {
                        backgroundSize: '100% 200%',
                        backgroundImage:
                            'linear-gradient(180deg,#2b38a3,#655afd 49.45%,#665afe 50%,#655afd 50.55%,#2b38a3)',
                        transition: '0.4s',
                        '&:hover': {
                            backgroundPositionY: '98%'
                        },
                        '&.Mui-disabled': {
                            backgroundImage: 'none'
                        }
                    }
                }
            }
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    borderRadius: 6
                }
            }
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 6
                }
            }
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 6
                }
            }
        },
        MuiBackdrop: {
            styleOverrides: {
                root: {
                    backdropFilter: 'blur(5px)'
                }
            }
        }
    }
};
