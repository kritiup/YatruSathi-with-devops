import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Box, Button, TextField, Typography, Alert, Paper, CircularProgress } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { authService } from '../../services/api/auth';
import { redirectTarget } from '../../common/auth/redirect';

interface ApiError {
  response?: {
    status?: number;
    data?: {
      error?: string;
      message?: string;
      retry_after?: number;
    };
  };
  message?: string;
}

// A verification code is always issued right before this page loads (at
// signup), so the resend endpoint's 60s cooldown is already running.
const INITIAL_RESEND_COOLDOWN = 60;

export const VerifyOtp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  // Set when the user started from "join an activity" while signed out.
  const from = redirectTarget(location.state);
  // signup/resend report whether the code email actually went out.
  const [emailSent, setEmailSent] = useState(location.state?.emailSent !== false);

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(INITIAL_RESEND_COOLDOWN);

  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async () => {
    setError('');
    setSuccess('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);

    try {
      await authService.verifyOtp(email, otp);
      setSuccess('Email verified successfully!');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1500);
    } catch (err: unknown) {
      const error = err as ApiError;
      const apiMessage = error.response?.data?.error || error.response?.data?.message;
      if (apiMessage) {
        setError(apiMessage);
      } else if (error.message) {
        setError(`Verification failed: ${error.message}`);
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResendLoading(true);

    try {
      await authService.resendOtp(email);
      setEmailSent(true);
      setSuccess('A new verification code has been sent to your email');
      setResendCooldown(60); // 60 second cooldown
    } catch (err: unknown) {
      const error = err as ApiError;
      const apiMessage = error.response?.data?.error || error.response?.data?.message;
      if (error.response?.status === 429) {
        // Already within the cooldown window — sync our timer to the server's.
        setResendCooldown(error.response?.data?.retry_after ?? INITIAL_RESEND_COOLDOWN);
        setSuccess('');
        setError(apiMessage || 'Please wait before requesting a new code.');
      } else {
        setError(apiMessage || 'Failed to resend code. Please try again.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8fafc',
        px: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 500,
          p: { xs: 3, sm: 5 },
          borderRadius: 3,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: '#e3f2fd',
              mb: 2,
            }}
          >
            <MailOutlineIcon sx={{ fontSize: 40, color: '#083344' }} />
          </Box>

          <Typography variant="h4" fontWeight={600} gutterBottom>
            Verify Your Email
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            We've sent a 6-digit verification code to
          </Typography>
          <Typography fontWeight={600} color="primary" sx={{ mt: 0.5 }}>
            {email}
          </Typography>
        </Box>

        {!emailSent && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            We couldn't send the code to your email. Tap <strong>Resend Code</strong> below, or
            contact support if it keeps failing.
          </Alert>
        )}

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

        <TextField
          fullWidth
          label="Verification Code"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={e => {
            const value = e.target.value.replace(/\D/g, ''); // Only digits
            if (value.length <= 6) {
              setOtp(value);
            }
          }}
          inputProps={{
            maxLength: 6,
            style: {
              fontSize: '1.5rem',
              letterSpacing: '0.5rem',
              textAlign: 'center',
              fontWeight: 600,
            },
          }}
          sx={{ mb: 3 }}
          onKeyPress={e => {
            if (e.key === 'Enter' && otp.length === 6) {
              handleVerify();
            }
          }}
        />

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleVerify}
          disabled={loading || otp.length !== 6}
          sx={{
            py: 1.5,
            bgcolor: '#083344',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            '&:hover': {
              bgcolor: '#0f4c5c',
            },
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Email'}
        </Button>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Didn't receive the code?
          </Typography>
          <Button
            variant="text"
            onClick={handleResend}
            disabled={resendLoading || resendCooldown > 0}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: '#083344',
            }}
          >
            {resendLoading ? (
              <CircularProgress size={20} />
            ) : resendCooldown > 0 ? (
              `Resend in ${resendCooldown}s`
            ) : (
              'Resend Code'
            )}
          </Button>
        </Box>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="text"
            onClick={() => navigate('/signup')}
            sx={{
              textTransform: 'none',
              color: 'text.secondary',
            }}
          >
            ← Back to Signup
          </Button>
        </Box>

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
            The verification code will expire in 10 minutes
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
