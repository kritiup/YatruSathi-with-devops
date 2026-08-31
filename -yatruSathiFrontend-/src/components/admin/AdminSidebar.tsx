import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  HowToReg as KycIcon,
  BarChart as InsightsIcon,
  Logout as LogoutIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router';

interface AdminSidebarProps {
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Insights', icon: <InsightsIcon />, path: '/admin/kyc-approval' }, // Default dashboard
    { text: 'KYC Requests', icon: <KycIcon />, path: '/admin/kyc-requests' }, // To be implemented or tabbed
  ];

  return (
    <Box
      sx={{
        width: 280,
        height: '100vh',
        bgcolor: '#0f172a', // Deep dark blue/black
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        borderRight: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'primary.main',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DashboardIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
          YatruSathi Admin
        </Typography>
      </Box>

      <Typography
        variant="caption"
        sx={{
          px: 3,
          py: 1,
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        Pages
      </Typography>

      <List sx={{ px: 2 }}>
        {menuItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  color: isActive ? '#3b82f6' : 'rgba(255,255,255,0.7)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                    color: 'white',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontWeight: isActive ? 600 : 400, fontSize: '0.9rem' }}
                />
                {isActive && <ChevronRightIcon sx={{ fontSize: 18 }} />}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, mb: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>A</Avatar>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              Admin User
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }} noWrap>
              admin@yatrusathi.com
            </Typography>
          </Box>
          <IconButton size="small" onClick={onLogout} sx={{ color: 'rgba(255,255,255,0.4)' }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};
