import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Container,
  Paper,
  Stack,
  CircularProgress,
  Fade,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CheckCircle,
  EventAvailable,
  MoreVert,
  NotificationsActive,
  AccessTime,
  DeleteOutline,
  DoneAll,
  NotificationsNone,
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import api from '../../api/api';
import { notificationService } from '../../services/api/notification';

/* ================= ANIMATIONS ================= */
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

/* ================= TYPES ================= */
interface NotificationData {
  id: number;
  message: string;
  created_at: string;
  is_read: boolean;
  type?: 'approval' | 'new_event' | 'reminder';
}

/* ================= COMPONENT ================= */
export const Notification: React.FC = () => {
  const theme = useTheme();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get<NotificationData[]>('notifications/');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, id: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  const handleMarkAsRead = async () => {
    if (!selectedId) return;
    try {
      await api.patch(`notifications/${selectedId}/`, { is_read: true });
      setNotifications(prev => prev.map(n => (n.id === selectedId ? { ...n, is_read: true } : n)));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await api.delete(`notifications/${selectedId}/`);
      setNotifications(prev => prev.filter(n => n.id !== selectedId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
    handleMenuClose();
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'approval':
        return <CheckCircle sx={{ color: '#10b981' }} />;
      case 'new_event':
        return <EventAvailable sx={{ color: theme.palette.primary.main }} />;
      case 'reminder':
        return <AccessTime sx={{ color: '#f59e0b' }} />;
      default:
        return <NotificationsActive sx={{ color: theme.palette.primary.main }} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress thickness={5} size={60} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`,
        py: 8,
      }}
    >
      <Container maxWidth="md">
        {/* Header Section */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 6,
            animation: `${slideUp} 0.5s ease-out`,
          }}
        >
          <Box>
            <Typography
              variant="h2"
              sx={{ fontWeight: 900, color: '#1e293b', mb: 1, letterSpacing: '-0.02em' }}
            >
              Notifications
            </Typography>
            <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 500 }}>
              Stay updated with your latest alerts and events.
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            {unreadCount > 0 && (
              <>
                <Button
                  startIcon={<DoneAll />}
                  onClick={handleMarkAllAsRead}
                  variant="outlined"
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 3,
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  Mark all as read
                </Button>
                <Chip
                  label={`${unreadCount} New`}
                  sx={{
                    fontWeight: 800,
                    borderRadius: '10px',
                    px: 1,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    color: 'white',
                    animation: `${pulse} 2s infinite ease-in-out`,
                    boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.39)}`,
                  }}
                />
              </>
            )}
          </Stack>
        </Box>

        {notifications.length === 0 ? (
          <Paper
            sx={{
              p: 12,
              textAlign: 'center',
              borderRadius: '24px',
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Box
              sx={{
                width: 100,
                height: 100,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <NotificationsNone sx={{ fontSize: 48, color: theme.palette.primary.main }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
              Your inbox is clear!
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 300, margin: '0 auto' }}>
              We'll notify you as soon as there's something new for you.
            </Typography>
          </Paper>
        ) : (
          <Paper
            sx={{
              borderRadius: '24px',
              overflow: 'hidden',
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)',
            }}
          >
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <Fade in key={notification.id} timeout={400 + index * 100}>
                  <Box>
                    {index > 0 && (
                      <Divider sx={{ borderColor: alpha(theme.palette.primary.main, 0.08) }} />
                    )}
                    <ListItem
                      sx={{
                        py: 3.5,
                        px: { xs: 3, md: 5 },
                        position: 'relative',
                        bgcolor: notification.is_read
                          ? 'transparent'
                          : alpha(theme.palette.primary.main, 0.03),
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.06),
                          transform: 'translateX(8px)',
                          '& .item-actions': { opacity: 1 },
                        },
                      }}
                      secondaryAction={
                        <Box
                          className="item-actions"
                          sx={{ opacity: 0.3, transition: 'opacity 0.2s' }}
                        >
                          <IconButton onClick={e => handleMenuClick(e, notification.id)}>
                            <MoreVert />
                          </IconButton>
                        </Box>
                      }
                    >
                      {!notification.is_read && (
                        <Box
                          sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 6,
                            background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            borderRadius: '0 4px 4px 0',
                          }}
                        />
                      )}
                      <ListItemAvatar sx={{ minWidth: 70 }}>
                        <Avatar
                          sx={{
                            width: 52,
                            height: 52,
                            bgcolor: 'white',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            border: `2px solid ${alpha(theme.palette.primary.main, 0.05)}`,
                          }}
                        >
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={1}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 800,
                                color: notification.is_read
                                  ? '#1e293b'
                                  : theme.palette.primary.main,
                                fontSize: '1.1rem',
                                transition: 'color 0.3s ease',
                              }}
                            >
                              {notification.type === 'approval'
                                ? 'Registration Approved ✨'
                                : 'Notification Update'}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: '#94a3b8', fontWeight: 600 }}
                            >
                              •{' '}
                              {new Date(notification.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Typography>
                          </Stack>
                        }
                        secondary={
                          <Typography
                            variant="body1"
                            sx={{ color: '#64748b', lineHeight: 1.6, fontWeight: 500 }}
                          >
                            {notification.message}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </Box>
                </Fade>
              ))}
            </List>
          </Paper>
        )}
      </Container>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        TransitionComponent={Fade}
        elevation={0}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            minWidth: 200,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            mt: 1.5,
            p: 1,
          },
        }}
      >
        <MenuItem onClick={handleMarkAsRead} sx={{ borderRadius: '10px', py: 1.5, mb: 0.5 }}>
          <DoneAll fontSize="small" sx={{ mr: 2, color: theme.palette.primary.main }} />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Mark as read
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ borderRadius: '10px', py: 1.5, color: '#ef4444' }}>
          <DeleteOutline fontSize="small" sx={{ mr: 2 }} />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Remove alert
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};
