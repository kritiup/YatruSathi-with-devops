import React, { useState } from 'react';
import {
  AppBar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import { NavLink, Outlet, useNavigate } from 'react-router';

import { BrandMark } from '../common/components/BrandMark';
import { useHeader } from '../common/hooks/useHeader';
import { ROUTES } from '../common/constants/routes';
import Footer from './footer';

const NAV = [
  { label: 'Home', to: ROUTES.home },
  { label: 'Destinations', to: ROUTES.destinations },
  { label: 'Activities', to: ROUTES.activities },
  { label: 'Packages', to: ROUTES.packages },
  { label: 'About Us', to: ROUTES.about },
];

/**
 * The chrome for every public-facing page: a solid top navigation bar and the
 * green footer, with the routed page in between. No sidebar — that belongs to
 * the signed-in account area (`AccountLayout`).
 */
export const PublicLayout: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, avatar, unreadNotifications, isAuthenticated, goToLogin, logout } = useHeader();

  const [navAnchor, setNavAnchor] = useState<null | HTMLElement>(null);
  const [acctAnchor, setAcctAnchor] = useState<null | HTMLElement>(null);

  const linkSx = ({ isActive }: { isActive: boolean }) => ({
    textDecoration: 'none',
    color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
    fontWeight: 600,
    fontSize: '0.95rem',
    padding: '6px 4px',
    borderBottom: `2px solid ${isActive ? theme.palette.primary.main : 'transparent'}`,
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky">
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 2, minHeight: 68 }}>
            {isMobile && (
              <IconButton edge="start" onClick={e => setNavAnchor(e.currentTarget)}>
                <MenuIcon />
              </IconButton>
            )}
            <BrandMark onClick={() => navigate(ROUTES.home)} />

            {!isMobile && (
              <Stack direction="row" spacing={3} sx={{ ml: 4, flex: 1 }}>
                {NAV.map(n => (
                  <Box key={n.to} component={NavLink} to={n.to} style={linkSx}>
                    {n.label}
                  </Box>
                ))}
              </Stack>
            )}
            <Box sx={{ flex: isMobile ? 1 : 'unset' }} />

            {isAuthenticated ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton onClick={() => navigate(ROUTES.notifications)}>
                  <Badge badgeContent={unreadNotifications} color="error">
                    <NotificationsNoneIcon />
                  </Badge>
                </IconButton>
                <IconButton onClick={e => setAcctAnchor(e.currentTarget)} sx={{ p: 0.5 }}>
                  <Box
                    component="img"
                    src={avatar || '/images/user-avatar.jpg'}
                    alt={user?.username || 'Account'}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid',
                      borderColor: 'primary.light',
                    }}
                  />
                </IconButton>
                <Menu
                  anchorEl={acctAnchor}
                  open={Boolean(acctAnchor)}
                  onClose={() => setAcctAnchor(null)}
                  onClick={() => setAcctAnchor(null)}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  slotProps={{ paper: { sx: { mt: 1, minWidth: 190 } } }}
                >
                  <MenuItem onClick={() => navigate(ROUTES.dashboard)}>
                    <ListItemIcon>
                      <DashboardIcon fontSize="small" />
                    </ListItemIcon>
                    Dashboard
                  </MenuItem>
                  <MenuItem onClick={() => navigate(ROUTES.profile)}>
                    <ListItemIcon>
                      <PersonOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    Profile
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={logout} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    Log out
                  </MenuItem>
                </Menu>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button color="inherit" onClick={goToLogin} sx={{ fontWeight: 600 }}>
                  Login
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate(ROUTES.signup)}
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  Sign Up
                </Button>
              </Stack>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Menu
        anchorEl={navAnchor}
        open={Boolean(navAnchor)}
        onClose={() => setNavAnchor(null)}
        onClick={() => setNavAnchor(null)}
      >
        {NAV.map(n => (
          <MenuItem key={n.to} onClick={() => navigate(n.to)}>
            {n.label}
          </MenuItem>
        ))}
        {!isAuthenticated && <Divider />}
        {!isAuthenticated && <MenuItem onClick={() => navigate(ROUTES.signup)}>Sign Up</MenuItem>}
      </Menu>

      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default PublicLayout;
