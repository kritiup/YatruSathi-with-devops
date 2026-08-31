import { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Avatar,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Drawer,
  Tooltip,
  Badge,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import DeleteIcon from '@mui/icons-material/Delete';
import { chatService } from '../../services/api/chat';
import { authService } from '../../services/api/auth';
import { supabase } from '../../services/supabase';

interface User {
  id: number;
  username: string;
  email: string;
}

interface ChatMessage {
  id: number;
  sender: User;
  message: string;
  timestamp: string;
  is_system?: boolean;
  event?: number;
  group?: number;
}
interface ChatGroup {
  id: number;
  name: string;
  event_title: string;
  members: User[];
  created_at: string;
  last_message?: {
    message: string;
    sender_name: string;
    timestamp: string;
  };
  unread_count: number;
}

function Chatbox() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = authService.getCurrentUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial Load: Fetch groups and messages
  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);
        const fetchedGroups = await chatService.getChatGroups();
        setGroups(fetchedGroups);

        if (fetchedGroups.length > 0) {
          setSelectedGroup(fetchedGroups[0]);
          await chatService.markGroupAsRead(fetchedGroups[0].id);
          const initialMessages = await chatService.getGroupMessages(fetchedGroups[0].id);
          setMessages(initialMessages);
        }
      } catch (error) {
        console.error('Failed to fetch chat groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, []);

  // Real-time Subscription via Supabase
  useEffect(() => {
    if (!selectedGroup) return;

    // Fetch messages for new group
    const fetchMessages = async () => {
      const initialMessages = await chatService.getGroupMessages(selectedGroup.id);
      setMessages(initialMessages);
    };
    fetchMessages();

    // Subscribe to new messages in the 'event_chatmessage' table
    const subscription = supabase
      .channel(`group-${selectedGroup.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_chatmessage',
          filter: `group_id=eq.${selectedGroup.id}`,
        },
        async _payload => {
          // Since the payload only contains raw data, we fetch the full message with sender info
          const refreshedMessages = await chatService.getGroupMessages(selectedGroup.id);
          setMessages(refreshedMessages);

          // Mark as read immediately if we are viewing this group
          await chatService.markGroupAsRead(selectedGroup.id);
        }
      )
      .subscribe();

    // Mark current group as read on load
    chatService.markGroupAsRead(selectedGroup.id);

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedGroup]);

  // Real-time Sidebar Updates: Listen for ALL new messages to update badges
  useEffect(() => {
    const subscription = supabase
      .channel('chatbox-sidebar-refresh')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_chatmessage',
        },
        async () => {
          try {
            const fetchedGroups = await chatService.getChatGroups();
            setGroups(fetchedGroups);
          } catch (error) {
            console.error('Failed to refresh groups for sidebar:', error);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSendMessage = async () => {
    if (inputValue.trim() && selectedGroup && currentUser) {
      const messageText = inputValue.trim();
      setInputValue('');

      try {
        // Mark as read when sending (implicitly read)
        await chatService.markGroupAsRead(selectedGroup.id);

        // Optimistic UI Update
        const optimisticMsg: ChatMessage = {
          id: Date.now(),
          sender: currentUser,
          message: messageText,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimisticMsg]);

        await chatService.sendMessage(0, messageText, selectedGroup.id);

        // Update last message in sidebar optimistically
        setGroups(prev =>
          prev.map(g =>
            g.id === selectedGroup.id
              ? {
                  ...g,
                  last_message: {
                    message: messageText,
                    sender_name: currentUser.username,
                    timestamp: new Date().toISOString(),
                  },
                }
              : g
          )
        );
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!selectedGroup) return;
    try {
      await chatService.removeMember(selectedGroup.id, userId);
      // Refresh group details
      const updatedGroup = await chatService.getGroupDetail(selectedGroup.id);
      setSelectedGroup(updatedGroup);
      setGroups(prev => prev.map(g => (g.id === updatedGroup.id ? updatedGroup : g)));
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '90vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '90vh', bgcolor: '#f0f2f5' }}>
      {/* Groups Sidebar */}
      <Box
        sx={{
          width: { xs: '100%', sm: 320 },
          borderRight: '1px solid #e5e5e5',
          display: { xs: selectedGroup ? 'none' : 'flex', sm: 'flex' },
          flexDirection: 'column',
          bgcolor: '#fff',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Chats
          </Typography>
        </Box>
        <Divider />
        <List sx={{ flex: 1, overflow: 'auto' }}>
          {groups.map(group => (
            <ListItem key={group.id} disablePadding>
              <ListItemButton
                selected={selectedGroup?.id === group.id}
                onClick={() => {
                  setSelectedGroup(group);
                  setGroups(prev =>
                    prev.map(g => (g.id === group.id ? { ...g, unread_count: 0 } : g))
                  );
                }}
                sx={{
                  '&.Mui-selected': { bgcolor: '#e7f3ff', color: '#0084ff' },
                }}
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={group.unread_count}
                    color="error"
                  >
                    <Avatar sx={{ bgcolor: '#0084ff' }}>
                      <GroupsIcon />
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={group.name}
                  secondary={
                    group.last_message
                      ? `${group.last_message.sender_name}: ${group.last_message.message}`
                      : group.event_title
                  }
                  primaryTypographyProps={{ fontWeight: 600 }}
                  secondaryTypographyProps={{
                    noWrap: true,
                    fontSize: '0.8rem',
                    sx: {
                      color: group.unread_count > 0 ? 'text.primary' : 'text.secondary',
                      fontWeight: group.unread_count > 0 ? 700 : 400,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          {groups.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No groups joined yet.
              </Typography>
            </Box>
          )}
        </List>
      </Box>

      {/* Chat Area */}
      <Box
        sx={{
          flex: 1,
          display: { xs: selectedGroup ? 'flex' : 'none', sm: 'flex' },
          flexDirection: 'column',
          bgcolor: '#fff',
          position: 'relative',
        }}
      >
        {selectedGroup ? (
          <>
            {/* Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid #e5e5e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: '#0084ff' }}>
                  <GroupsIcon />
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedGroup.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#65676b' }}>
                    {selectedGroup.members.length} members
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setShowMembers(true)}>
                <InfoIcon color="primary" />
              </IconButton>
            </Box>

            {/* Messages */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              {messages.map(msg => {
                const isMe = msg.sender.id === currentUser?.id;
                const isSystem = msg.is_system;

                if (isSystem) {
                  return (
                    <Box key={msg.id} sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          bgcolor: '#f0f2f5',
                          px: 2,
                          py: 0.5,
                          borderRadius: 10,
                          color: '#65676b',
                        }}
                      >
                        {msg.message}
                      </Typography>
                    </Box>
                  );
                }

                return (
                  <Box
                    key={msg.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {!isMe && (
                      <Typography
                        variant="caption"
                        sx={{ ml: 1, mb: 0.2, fontWeight: 600, color: '#65676b' }}
                      >
                        {msg.sender.username}
                      </Typography>
                    )}
                    <Paper
                      elevation={0}
                      sx={{
                        p: '8px 12px',
                        maxWidth: '70%',
                        bgcolor: isMe ? '#0084ff' : '#f0f2f5',
                        color: isMe ? '#fff' : '#050505',
                        borderRadius: '18px',
                        borderBottomRightRadius: isMe ? '4px' : '18px',
                        borderBottomLeftRadius: isMe ? '18px' : '4px',
                      }}
                    >
                      <Typography variant="body2">{msg.message}</Typography>
                    </Paper>
                    <Typography
                      variant="caption"
                      sx={{ mt: 0.2, mx: 1, opacity: 0.6, fontSize: '0.7rem' }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <Divider />
            <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
              <IconButton size="small">
                <AttachFileIcon />
              </IconButton>
              <TextField
                fullWidth
                placeholder="Aa"
                size="small"
                multiline
                maxRows={3}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 5,
                    bgcolor: '#f0f2f5',
                    border: 'none',
                  },
                }}
              />
              <IconButton color="primary" onClick={handleSendMessage} disabled={!inputValue.trim()}>
                <SendIcon />
              </IconButton>
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Select a chat to start messaging
            </Typography>
          </Box>
        )}
      </Box>

      {/* Members List Drawer */}
      <Drawer anchor="right" open={showMembers} onClose={() => setShowMembers(false)}>
        <Box sx={{ width: 280, p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Members
          </Typography>
          <List>
            {selectedGroup?.members.map(member => (
              <ListItem
                key={member.id}
                secondaryAction={
                  currentUser?.id !== member.id && (
                    <Tooltip title="Remove Member">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </Tooltip>
                  )
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={member.username}
                  primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }}
                  secondary={member.id === currentUser?.id ? 'You' : ''}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}

export default Chatbox;
