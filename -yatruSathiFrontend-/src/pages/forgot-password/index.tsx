import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, TextField, Typography, Alert, Paper, CircularProgress } from '@mui/material';
import { authService } from '../../services/api/auth';

const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await authService.requestPasswordOtp(email);
      setSuccess(res.message || 'OTP sent to your email');
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await authService.verifyPasswordOtp(email, otp);
      setResetToken(res.reset_token);
      setSuccess('OTP verified. Set your new password.');
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authService.resetPassword(email, resetToken, newPassword);
      setSuccess('Password reset successful. You can now log in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        bgcolor: '#f8fafc',
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 4 },
          py: { xs: 4, md: 0 },
        }}
      >
        <Paper elevation={3} sx={{ width: '100%', maxWidth: 380, p: 4 }}>
          <Typography variant="h6" fontWeight={700} align="center">
            YATRUSATHI.CO
          </Typography>
          <Typography variant="h4" fontWeight={600} mt={4} align="center">
            Forgot Password
          </Typography>
          <Typography color="text.secondary" mb={4} align="center">
            Reset your account password
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {step === 1 && (
            <form onSubmit={handleRequestOtp}>
              <TextField
                fullWidth
                label="Email Address"
                margin="normal"
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                required
              />
              <Button
                fullWidth
                variant="contained"
                sx={{
                  mt: 2,
                  py: 1.3,
                  bgcolor: '#083344',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#0f4c5c' },
                }}
                type="submit"
                disabled={loading}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Send OTP'}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <TextField
                fullWidth
                label="Enter OTP"
                margin="normal"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                inputProps={{ maxLength: 6 }}
              />
              <Button
                fullWidth
                variant="contained"
                sx={{
                  mt: 2,
                  py: 1.3,
                  bgcolor: '#083344',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#0f4c5c' },
                }}
                type="submit"
                disabled={loading}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Verify OTP'}
              </Button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSetPassword}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                margin="normal"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <Button
                fullWidth
                variant="contained"
                sx={{
                  mt: 2,
                  py: 1.3,
                  bgcolor: '#083344',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#0f4c5c' },
                }}
                type="submit"
                disabled={loading}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Set Password'}
              </Button>
            </form>
          )}
        </Paper>
      </Box>
      {/* Optionally, add a right-side image or illustration for consistency */}
    </Box>
  );
};

export default ForgotPasswordPage;
