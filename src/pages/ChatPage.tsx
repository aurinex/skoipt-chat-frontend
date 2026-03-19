import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, TextField, IconButton, Typography, Paper, List, ListItem, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import api, { socket } from '../services/api';

const ChatPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<any>(null);

  useEffect(() => {
    if (chatId) {
      api.messages.list(chatId).then(setMessages);
    }
  }, [chatId]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
  if (!inputText.trim() || !chatId) return;
  try {
    const msg = await api.messages.send(chatId, { text: inputText });
    
    // Проверяем, нет ли уже такого сообщения (вдруг сокет сработал быстрее)
    setMessages((prev) => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });

    window.dispatchEvent(new CustomEvent('local_message_sent', { detail: msg }));
    
    setInputText('');
    socket.sendTyping(chatId, false);
  } catch (err) {
    console.error("Ошибка отправки:", err);
  }
};

useEffect(() => {
  if (!chatId) return;

  const unsubMsg = socket.on('new_message', (data: any) => {
    const message = data.message || data; 

    // Проверка 1: тот ли это чат?
    if (String(message.chat_id) === String(chatId)) {
      setMessages((prev) => {
        // Проверка 2: ГЛАВНАЯ. Есть ли сообщение с таким ID уже в списке?
        if (prev.some(m => m.id === message.id)) {
          return prev; // Если есть, ничего не делаем
        }
        return [...prev, message];
      });
      
      socket.sendRead(message.id);
    }
  });

  const unsubTyping = socket.on('typing', ({ user_id, is_typing, chat_id }: any) => {
    if (String(chat_id) === String(chatId)) {
      setTypingUsers(prev => 
        is_typing ? [...new Set([...prev, user_id])] : prev.filter(id => id !== user_id)
      );
    }
  });

  return () => {
    unsubMsg();
    unsubTyping();
  };
}, [chatId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (chatId) {
      socket.sendTyping(chatId, true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => socket.sendTyping(chatId, false), 2000);
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Список сообщений */}
      <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, p: 2 }}>
        <List>
          {messages.map((msg) => (
            <ListItem 
              key={msg.id} 
              sx={{ 
                flexDirection: 'column', 
                alignItems: msg.is_mine ? 'flex-end' : 'flex-start',
                mb: 1 
              }}
            >
              <Paper sx={{ 
                p: 1.5, 
                bgcolor: msg.is_mine ? 'primary.main' : 'grey.200', 
                color: msg.is_mine ? 'white' : 'black',
                borderRadius: 2,
                maxWidth: '70%'
              }}>
                <Typography variant="body1">{msg.text}</Typography>
              </Paper>
              <Typography variant="caption" color="textSecondary">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {msg.is_mine && (msg.is_read ? ' ✓✓' : ' ✓')}
              </Typography>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Индикатор печати */}
      {typingUsers.length > 0 && (
        <Typography variant="caption" sx={{ fontStyle: 'italic', ml: 2, mb: 1 }}>
          Кто-то печатает...
        </Typography>
      )}

      {/* Поле ввода */}
      <Paper sx={{ p: '2px 4px', display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="standard"
          placeholder="Напишите сообщение..."
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          sx={{ ml: 1, flex: 1 }}
          InputProps={{ disableUnderline: true }}
        />
        <IconButton color="primary" onClick={handleSend}>
          <SendIcon />
        </IconButton>
      </Paper>
    </Box>
  );
};

export default ChatPage;