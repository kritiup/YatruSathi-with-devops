import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Box, TextField, IconButton, Avatar, Paper, Typography, Divider } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  avatar?: string;
  isThinking?: boolean;
}

function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Hi! I am YatruSathi AI, your personal travel assistant for Nepal. How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);

  const handleSendMessage = async () => {
    if (inputValue.trim() && !isBotThinking) {
      const userText = inputValue.trim();
      const userMessage: Message = {
        id: String(Date.now()),
        sender: 'user',
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsBotThinking(true);

      const thinkingId = String(Date.now() + 1);
      const thinkingMessage: Message = {
        id: thinkingId,
        sender: 'bot',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isThinking: true,
      };
      setMessages(prev => [...prev, thinkingMessage]);

      try {
        const chatbotUrl = import.meta.env.VITE_CHATBOT_URL || 'http://localhost:5000';
        const response = await fetch(`${chatbotUrl}/api/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userText, session_id: 'ui-session-default' }),
          signal: AbortSignal.timeout(180000),
        });

        if (!response.ok || !response.body) throw new Error('Stream unavailable');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.token) {
                accumulated += payload.token;
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === thinkingId ? { ...msg, text: accumulated, isThinking: false } : msg
                  )
                );
              }
              if (payload.done) break;
            } catch {
              /* ignore parse errors on partial chunks */
            }
          }
        }
        setMessages(prev =>
          prev.map(msg => (msg.id === thinkingId ? { ...msg, isThinking: false } : msg))
        );
      } catch (error) {
        console.error('AI Chatbot Error:', error);
        setMessages(prev =>
          prev.map(msg =>
            msg.id === thinkingId
              ? {
                  ...msg,
                  text: "Sorry, I'm having trouble connecting. Make sure the AI service is running.",
                  isThinking: false,
                }
              : msg
          )
        );
      } finally {
        setIsBotThinking(false);
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '90vh', bgcolor: '#fff' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: { xs: '100%', sm: 280 },
          borderRight: '1px solid #e5e5e5',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#fff',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            AI Assistant
          </Typography>
        </Box>
        <Divider />
        {/* Conversations list removed per user request */}
      </Box>

      {/* Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #e5e5e5',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Avatar sx={{ bgcolor: '#FF4B2B', fontSize: '20px' }}>🤖</Avatar>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              YatruSathi AI
            </Typography>
            <Typography variant="caption" sx={{ color: '#65676b' }}>
              Powered by Groq AI · Nepal Hidden Gems
            </Typography>
          </Box>
        </Box>

        {/* Messages */}
        <Box
          sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {messages.map(message => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                gap: 1,
              }}
            >
              {message.sender === 'bot' && (
                <Avatar sx={{ bgcolor: '#FF4B2B', width: 32, height: 32, fontSize: '14px' }}>
                  🤖
                </Avatar>
              )}
              <Paper
                sx={{
                  p: '8px 12px',
                  maxWidth: '75%',
                  bgcolor: message.sender === 'user' ? '#0084ff' : '#f0f2f5',
                  color: message.sender === 'user' ? '#fff' : '#050505',
                  borderRadius: '18px',
                  boxShadow: 'none',
                  border: message.sender === 'bot' ? '1px solid #e5e5e5' : 'none',
                }}
              >
                {message.isThinking ? (
                  <Box sx={{ display: 'flex', gap: 0.5, py: 1, px: 0.5 }}>
                    {[0, 0.16, 0.32].map((delay, i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 8,
                          height: 8,
                          bgcolor: '#90949c',
                          borderRadius: '50%',
                          animation: 'bounce 1.4s infinite ease-in-out both',
                          animationDelay: `${delay}s`,
                        }}
                      />
                    ))}
                  </Box>
                ) : message.sender === 'bot' ? (
                  <Box
                    sx={{
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      '& h1': { fontSize: '1.1rem', fontWeight: 700, mt: 1.5, mb: 0.75 },
                      '& h2': { fontSize: '1rem', fontWeight: 700, mt: 1.25, mb: 0.5 },
                      '& h3': { fontSize: '0.9rem', fontWeight: 700, mt: 1, mb: 0.5 },
                      '& p': { mb: 0.75, mt: 0 },
                      '& ul': { pl: 2.5, my: 0.5 },
                      '& ol': { pl: 2.5, my: 0.5 },
                      '& li': { mb: 0.4 },
                      '& strong': { fontWeight: 700 },
                      '& hr': { border: 'none', borderTop: '1px solid #d0d0d0', my: 1 },
                      '& code': {
                        bgcolor: '#e8e8e8',
                        px: 0.5,
                        borderRadius: 0.5,
                        fontSize: '0.8rem',
                        fontFamily: 'monospace',
                      },
                    }}
                  >
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.text}
                  </Typography>
                )}
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    opacity: 0.7,
                    fontSize: '11px',
                    textAlign: message.sender === 'user' ? 'right' : 'left',
                  }}
                >
                  {message.timestamp}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>

        {/* Input */}
        <Divider />
        <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <IconButton size="small" sx={{ color: '#0084ff' }}>
            <AttachFileIcon />
          </IconButton>
          <TextField
            fullWidth
            placeholder="Ask me about Nepal travel..."
            multiline
            maxRows={4}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '20px', bgcolor: '#f0f2f5' } }}
          />
          <IconButton size="small" sx={{ color: '#0084ff' }}>
            <EmojiEmotionsIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleSendMessage}
            disabled={isBotThinking}
            sx={{ color: '#0084ff' }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

export default AIChatbot;
