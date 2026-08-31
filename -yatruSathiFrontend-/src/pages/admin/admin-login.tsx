import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, AdminPanelSettings } from '@mui/icons-material';
import axios from 'axios';

const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const API_BASE_URL = RAW_API_BASE_URL.trim().replace(/\/+$/, '');

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefresh');
    localStorage.removeItem('isAdmin');

    try {
      const response = await axios.post(`${API_BASE_URL}/admin/login/`, {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      // Store admin token in localStorage
      localStorage.setItem('adminToken', response.data.access);
      localStorage.setItem('adminRefresh', response.data.refresh);
      localStorage.setItem('isAdmin', 'true');

      // Navigate to admin KYC approval page
      navigate('/admin/kyc-approval');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const apiError = err.response?.data as { error?: string } | undefined;
        setError(apiError?.error || 'Login failed. Please check your credentials.');
      } else {
        setError('Login failed. Please check your credentials.');
      }
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefresh');
      localStorage.removeItem('isAdmin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ boxShadow: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <AdminPanelSettings sx={{ fontSize: 60, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Admin Login
              </Typography>
              <Typography color="text.secondary">
                Secure access to KYC verification system
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Admin Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                sx={{ mb: 2 }}
                autoComplete="email"
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mb: 2, py: 1.5 }}
              >
                {loading ? 'Logging in...' : 'Login as Admin'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
