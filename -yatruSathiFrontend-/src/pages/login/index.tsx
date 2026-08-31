import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import AppleIcon from '@mui/icons-material/Apple';
import axios from 'axios';
import api from '../../api/api';
import { BrandMark } from '../../common/components/BrandMark';
import { redirectTarget } from '../../common/auth/redirect';
import { BRAND } from '../../theme';

const SocialButtons: React.FC = () => (
  <Stack direction="row" spacing={2} justifyContent="center">
    {[GoogleIcon, FacebookIcon, AppleIcon].map((Icon, i) => (
      <Button
        key={i}
        variant="outlined"
        disabled
        sx={{ minWidth: 0, px: 2, py: 1, borderRadius: 2 }}
        title="Social sign-in coming soon"
      >
        <Icon />
      </Button>
    ))}
  </Stack>
);

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = redirectTarget(location.state);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('auth/login/', { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate(from, { replace: true });
      } else {
        setError('No token received from server');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error || err.response?.data?.message || 'Invalid email or password'
        );
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
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
        bgcolor: BRAND.canvas,
        px: 2,
        py: 6,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: { xs: 3, sm: 5 },
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <BrandMark onClick={() => navigate('/home')} />
          <Typography variant="h4" sx={{ mt: 3 }}>
            Welcome Back!
          </Typography>
          <Typography color="text.secondary">Login to continue your journey</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Email Address"
          type="email"
          margin="normal"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          margin="normal"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleLogin()}
        />

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
              />
            }
            label={<Typography variant="body2">Remember me</Typography>}
          />
          <Link component="button" variant="body2" onClick={() => navigate('/forgot-password')}>
            Forgot Password?
          </Link>
        </Stack>

        <Button
          fullWidth
          variant="contained"
          size="large"
          sx={{ mt: 2 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Login'}
        </Button>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Or login with
          </Typography>
        </Divider>
        <SocialButtons />

        <Typography align="center" variant="body2" sx={{ mt: 3 }}>
          Don&apos;t have an account?{' '}
          <Link component="button" onClick={() => navigate('/signup', { state: { from } })}>
            Sign Up
          </Link>
        </Typography>

        <Typography
          align="center"
          variant="caption"
          color="text.secondary"
          sx={{ mt: 2, display: 'block' }}
        >
          <Link component="button" color="inherit" onClick={() => navigate('/admin/login')}>
            Staff / admin login
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;
