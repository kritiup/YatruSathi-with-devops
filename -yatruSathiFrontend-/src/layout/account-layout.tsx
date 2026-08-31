import React, { useState } from 'react';
import {
  AppBar,
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RateReviewIcon from '@mui/icons-material/RateReview';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Outlet, useLocation, useNavigate } from 'react-router';

import { BrandMark } from '../common/components/BrandMark';
import { useHeader } from '../common/hooks/useHeader';
import { ROUTES } from '../common/constants/routes';
import { BRAND } from '../theme';

const WIDTH = 264;

const NAV = [
  { label: 'Dashboard', to: ROUTES.dashboard, icon: <SpaceDashboardIcon /> },
  { label: 'My Bookings', to: ROUTES.myBookings, icon: <ConfirmationNumberIcon /> },
  { label: 'My Wishlist', to: ROUTES.myWishlist, icon: <FavoriteBorderIcon /> },
  { label: 'My Reviews', to: ROUTES.myReviews, icon: <RateReviewIcon /> },
  { label: 'Notifications', to: ROUTES.notifications, icon: <NotificationsNoneIcon /> },
  { label: 'Settings', to: ROUTES.settings, icon: <SettingsIcon /> },
];

/**
 * The signed-in account area: a persistent left sidebar (profile card + the
 * dashboard sections) with a slim top bar. Wrapped by `<RequireAuth>` in the
 * router, so it only ever renders for an authenticated user.
 */
export const AccountLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, avatar, unreadNotifications, logout } = useHeader();
  const [mobileOpen, setMobileOpen] = useState(false);

  const active = NAV.find(n => location.pathname === n.to);
  const title = active?.label ?? 'Dashboard';

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2.5 }}>
        <BrandMark onClick={() => navigate(ROUTES.home)} />
      </Toolbar>
      <Divider />

      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component="img"
          src={avatar || '/images/user-avatar.jpg'}
          alt={user?.username || 'Account'}
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid',
            borderColor: 'primary.light',
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {user?.username || user?.email || 'Traveller'}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            component="button"
            onClick={() => navigate(ROUTES.profile)}
            sx={{
              border: 0,
              background: 'none',
              p: 0,
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            View profile
          </Typography>
        </Box>
      </Box>
      <Divider />

      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {NAV.map(item => {
          const selected = location.pathname === item.to;
          return (
            <ListItemButton
              key={item.to}
              selected={selected}
              onClick={() => {
                navigate(item.to);
                setMobileOpen(false);
              }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                py: 1.05,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#fff',
                  '& .MuiListItemIcon-root': { color: '#fff' },
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: selected ? '#fff' : 'text.secondary' }}>
                {item.label === 'Notifications' ? (
                  <Badge badgeContent={unreadNotifications} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: selected ? 700 : 600, fontSize: '.93rem' }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={logout}
          sx={{ borderRadius: 2, color: 'error.main', justifyContent: 'center' }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: 'error.main' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 700 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: BRAND.canvas }}>
      <AppBar
        position="fixed"
        sx={{ width: { md: `calc(100% - ${WIDTH}px)` }, ml: { md: `${WIDTH}px` } }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(v => !v)}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <IconButton
            onClick={() => navigate(ROUTES.home)}
            sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            title="Back to site"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>
            {title}
          </Typography>
          <IconButton onClick={() => navigate(ROUTES.notifications)}>
            <Badge badgeContent={unreadNotifications} color="error">
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: WIDTH },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${WIDTH}px)` },
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AccountLayout;
