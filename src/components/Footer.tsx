import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import useConfig from 'hooks/useConfig';

const Footer = () => {
    const { isDark } = useConfig();
    return (
        <AppBar
            position="static"
            component="footer"
            color={isDark ? 'primary' : 'secondary'}
            sx={{
                marginLeft: 0,
                transition: '.5s',
                width: '100%',
                padding: 0,
                boxShadow: '0px 0px 12px 2px rgb(0 0 0 / 30%)',
                bgcolor: (theme) => `${theme.palette.background.default}99`
            }}
        >
            <Toolbar
                sx={{
                    justifyContent: 'center',
                    minHeight: '48px !important'
                }}
            >
                <Typography fontSize={14} color="textSecondary">
                    Powered by TrueDefi
                </Typography>
            </Toolbar>
        </AppBar>
    );
};

export default Footer;
