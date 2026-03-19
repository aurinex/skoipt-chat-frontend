import { AppBar, Toolbar, Typography, Box, Drawer, List, ListItem, ListItemButton, ListItemText, Divider, Container, CssBaseline, Button } from '@mui/material';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import api, { socket } from '../services/api';
import { useEffect, useState } from 'react';

const drawerWidth = 300;

const Layout = () => {
  const [chats, setChats] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.chats.list().then(setChats);
    
    // Обработчик для сокета
    const unsub = socket.on('new_message', ({ message }: any) => {
        updateLastMessage(message);
    });

    // Обработчик для своих же отправленных сообщений
    const handleLocalSent = (e: any) => {
        updateLastMessage(e.detail);
    };

    const updateLastMessage = (message: any) => {
        setChats(prev => prev.map(chat => 
        String(chat.id) === String(message.chat_id) 
            ? { ...chat, last_message: message } 
            : chat
        ).sort((a, b) => {
        const timeA = new Date(a.last_message?.created_at || 0).getTime();
        const timeB = new Date(b.last_message?.created_at || 0).getTime();
        return timeB - timeA;
        }));
    };

    window.addEventListener('local_message_sent', handleLocalSent);
    
    return () => {
        unsub();
        window.removeEventListener('local_message_sent', handleLocalSent);
    };
    }, []);

  const handleLogout = async () => {
    await api.auth.logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Messenger
          </Typography>
          <Button color="inherit" onClick={handleLogout}>Выйти</Button>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {chats.map((chat) => (
              <ListItem key={chat.id} disablePadding>
                <ListItemButton component={Link} to={`/chat/${chat.id}`}>
                  <ListItemText 
                    primary={chat.name || 'Диалог'} 
                    secondary={chat.last_message?.text}
                    secondaryTypographyProps={{ noWrap: true }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;