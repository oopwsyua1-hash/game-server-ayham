import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Box,
  Chip,
} from '@mui/material';
import api from '../utils/api';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/api/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ marginBottom: 3 }}>
        إدارة الغرف
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>رقم الغرفة</TableCell>
              <TableCell>اسم الغرفة</TableCell>
              <TableCell>عدد المستخدمين</TableCell>
              <TableCell>إجمالي الدعم</TableCell>
              <TableCell>الحالة</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.room_id}>
                <TableCell>{room.room_id}</TableCell>
                <TableCell>{room.name}</TableCell>
                <TableCell>{room.users.length}</TableCell>
                <TableCell>{room.top_gifts_today}</TableCell>
                <TableCell>
                  <Chip
                    label={room.users.length > 0 ? 'نشطة' : 'فارغة'}
                    color={room.users.length > 0 ? 'success' : 'default'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Rooms;
