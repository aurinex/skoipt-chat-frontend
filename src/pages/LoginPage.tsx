import { useState } from 'react';
import { TextField, Button, Paper, Typography, Box, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const LoginPage = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.auth.login(form);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper sx={{ p: 4, width: 400 }}>
        <Typography variant="h5" gutterBottom>Вход</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField 
            fullWidth label="Логин" margin="normal" 
            onChange={e => setForm({...form, username: e.target.value})} 
          />
          <TextField 
            fullWidth label="Пароль" type="password" margin="normal" 
            onChange={e => setForm({...form, password: e.target.value})} 
          />
          <Button fullWidth variant="contained" type="submit" sx={{ mt: 2 }}>
            Войти
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default LoginPage;