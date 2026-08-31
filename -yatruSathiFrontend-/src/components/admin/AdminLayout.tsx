import React from 'react';
import { Box, Breadcrumbs, Link, Typography } from '@mui/material';
import { AdminSidebar } from './AdminSidebar';
import { useNavigate } from 'react-router';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefresh');
    localStorage.removeItem('isAdmin');
    navigate('/admin/login');
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <AdminSidebar onLogout={handleLogout} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: '280px', // Width of sidebar
          p: 4,
          width: 'calc(100% - 280px)',
        }}
      >
        {/* Header / Breadcrumbs */}
        <Box sx={{ mb: 4 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
            <Link
              underline="hover"
              color="inherit"
              href="/admin/kyc-approval"
              sx={{ fontSize: '0.875rem' }}
            >
              Insights
            </Link>
            <Typography color="text.primary" sx={{ fontSize: '0.875rem' }}>
              {title}
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#1e293b', mb: 1 }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body1" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            {/* Action buttons could go here */}
          </Box>
        </Box>

        {/* Page Content */}
        {children}
      </Box>
    </Box>
  );
};
