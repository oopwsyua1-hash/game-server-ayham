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
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  DialogActions,
} from '@mui/material';
import api from '../utils/api';

const Gifts = () => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '' });

  useEffect(() => {
    fetchGifts();
  }, []);

  const fetchGifts = async () => {
    try {
      const response = await api.get('/api/gifts');
      setGifts(response.data);
    } catch (error) {
      console.error('Error fetching gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGift = async () => {
    try {
      // Add gift API call here
      setOpenDialog(false);
      setFormData({ name: '', price: '' });
      fetchGifts();
    } catch (error) {
      console.error('Error adding gift:', error);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <Typography variant="h4">إدارة الهدايا</Typography>
        <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)}>
          إضافة هدية
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>الصورة</TableCell>
              <TableCell>الاسم</TableCell>
              <TableCell>السعر</TableCell>
              <TableCell>الفئة</TableCell>
              <TableCell>حار</TableCell>
              <TableCell>VIP فقط</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {gifts.map((gift) => (
              <TableRow key={gift.giftId}>
                <TableCell>
                  <img src={gift.animation} alt={gift.name} style={{ width: 40, height: 40 }} />
                </TableCell>
                <TableCell>{gift.name}</TableCell>
                <TableCell>{gift.price}</TableCell>
                <TableCell>{gift.category}</TableCell>
                <TableCell>
                  <Chip
                    label={gift.isHot ? 'نعم' : 'لا'}
                    color={gift.isHot ? 'error' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={gift.vipOnly ? 'نعم' : 'لا'}
                    color={gift.vipOnly ? 'primary' : 'default'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>إضافة هدية جديدة</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="اسم الهدية"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="السعر"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>إلغاء</Button>
          <Button onClick={handleAddGift} variant="contained" color="primary">
            إضافة
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Gifts;
