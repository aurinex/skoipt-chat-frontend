import { useEffect, useState } from 'react';
import api, { socket } from '../../services/api';
// ... MUI imports

const ChatList = () => {
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    // Начальная загрузка
    api.chats.list().then(setChats);

    // Подписка на новые сообщения для обновления превью в списке
    const unsubMessage = socket.on('new_message', ({ message }) => {
      setChats(prev => {
        const newChats = prev.map(chat => 
          chat.id === message.chat_id 
            ? { ...chat, last_message: message, unread_count: (chat.unread_count || 0) + 1 } 
            : chat
        );
        // Сортируем, чтобы чат с новым сообщением поднялся вверх
        return [...newChats].sort((a, b) => 
          new Date(b.last_message?.created_at).getTime() - new Date(a.last_message?.created_at).getTime()
        );
      });
    });

    // Подписка на статусы (Online/Offline)
    const unsubStatus = socket.on('user_status', ({ user_id, is_online }) => {
      setChats(prev => prev.map(chat => {
        if (chat.type === 'direct' && chat.interlocutor?.id === user_id) {
          return { ...chat, interlocutor: { ...chat.interlocutor, is_online } };
        }
        return chat;
      }));
    });

    return () => { unsubMessage(); unsubStatus(); };
  }, []);

  useEffect(() => {
  const unsub = socket.on('new_message', (data: any) => {
    const msg = data.message || data;
    
    setChats(prev => {
      return prev.map(chat => 
        String(chat.id) === String(msg.chat_id) 
          ? { ...chat, last_message: msg } 
          : chat
      ).sort((a, b) => {
        // Сортировка по времени последнего сообщения
        const timeA = new Date(a.last_message?.created_at || 0).getTime();
        const timeB = new Date(b.last_message?.created_at || 0).getTime();
        return timeB - timeA;
      });
    });
  });
  return () => unsub();
}, []);

  return (
    <List>
      {chats.map(chat => (
        <ListItem key={chat.id} secondaryAction={
          chat.unread_count > 0 && <Badge badgeContent={chat.unread_count} color="primary" />
        }>
          <ListItemAvatar>
            <StyledBadge 
              overlap="circular" 
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot" 
              invisible={!chat.interlocutor?.is_online}
            >
              <Avatar src={chat.avatar_url} />
            </StyledBadge>
          </ListItemAvatar>
          <ListItemText primary={chat.name} secondary={chat.last_message?.text} />
        </ListItem>
      ))}
    </List>
  );
};