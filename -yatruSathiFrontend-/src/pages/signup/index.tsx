import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Divider,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import AppleIcon from '@mui/icons-material/Apple';
import { authService } from '../../services/api/auth';
import { BrandMark } from '../../common/components/BrandMark';
import { redirectTarget } from '../../common/auth/redirect';
import { BRAND } from '../../theme';

interface SignupError {
  response?: { data?: { error?: string; message?: string } };
  message?: string;
}

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = redirectTarget(location.state);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [field]: e.target.value });

  const handleSignup = async () => {
    setError('');
    if (!formData.username || !formData.email || !formData.password) {
      setError('Username, email, and password are required');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.signup({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
      });

      if (response.verification_required) {
        navigate('/verify-otp', {
          state: {
            email: formData.email,
            from,
            emailSent: response.email_sent !== false,
          },
        });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      const e = err as SignupError;
      setError(
        e.response?.data?.error ||
          e.response?.data?.message ||
          (e.message ? `Signup failed: ${e.message}` : 'Signup failed. Please try again.')
      );
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
          maxWidth: 460,
          p: { xs: 3, sm: 5 },
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <BrandMark onClick={() => navigate('/home')} />
          <Typography variant="h4" sx={{ mt: 3 }}>
            Create Account
          </Typography>
          <Typography color="text.secondary">Join us and start exploring Nepal</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            label="First name"
            margin="normal"
            value={formData.firstName}
            onChange={set('firstName')}
          />
          <TextField
            fullWidth
            label="Last name"
            margin="normal"
            value={formData.lastName}
            onChange={set('lastName')}
          />
        </Stack>
        <TextField
          fullWidth
          label="Username"
          margin="normal"
          value={formData.username}
          onChange={set('username')}
        />
        <TextField
          fullWidth
          label="Email Address"
          type="email"
          margin="normal"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          margin="normal"
          helperText="At least 8 characters"
          value={formData.password}
          onChange={set('password')}
        />
        <TextField
          fullWidth
          label="Confirm password"
          type="password"
          margin="normal"
          value={formData.confirmPassword}
          onChange={set('confirmPassword')}
          onKeyPress={e => e.key === 'Enter' && handleSignup()}
        />

        <Button
          fullWidth
          variant="contained"
          size="large"
          sx={{ mt: 2 }}
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? 'Creating account…' : 'Sign Up'}
        </Button>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Or sign up with
          </Typography>
        </Divider>
        <Stack direction="row" spacing={2} justifyContent="center">
          {[GoogleIcon, FacebookIcon, AppleIcon].map((Icon, i) => (
            <Button
              key={i}
              variant="outlined"
              disabled
              sx={{ minWidth: 0, px: 2, py: 1, borderRadius: 2 }}
              title="Social sign-up coming soon"
            >
              <Icon />
            </Button>
          ))}
        </Stack>

        <Typography align="center" variant="body2" sx={{ mt: 3 }}>
          Already have an account?{' '}
          <Link component="button" onClick={() => navigate('/login', { state: { from } })}>
            Login
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Signup;
