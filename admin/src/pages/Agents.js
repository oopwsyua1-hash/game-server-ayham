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
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
} from '@mui/material';
import api from '../utils/api';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', shamcash_number: '' });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await api.get('/agents');
      setAgents(response.data);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = async () => {
    try {
      // Add agent API call here
      setOpenDialog(false);
      setFormData({ name: '', phone: '', shamcash_number: '' });
      fetchAgents();
    } catch (error) {
      console.error('Error adding agent:', error);
    }
  };

  const toggleAgentStatus = async (agentId) => {
    // Toggle agent status API call
    fetchAgents();
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
        <Typography variant="h4">إدارة الوكلاء</Typography>
        <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)}>
          إضافة وكيل
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>الاسم</TableCell>
              <TableCell>رقم الهاتف</TableCell>
              <TableCell>رقم الشامكاش</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent._id}>
                <TableCell>{agent.name}</TableCell>
                <TableCell>{agent.phone}</TableCell>
                <TableCell>{agent.shamcash_number}</TableCell>
                <TableCell>
                  <Chip
                    label={agent.active ? 'نشط' : 'معطل'}
                    color={agent.active ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => toggleAgentStatus(agent._id)}
                  >
                    {agent.active ? 'تعطيل' : 'تفعيل'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>إضافة وكيل جديد</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="الاسم"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="رقم الهاتف"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="رقم الشامكاش"
            value={formData.shamcash_number}
            onChange={(e) => setFormData({ ...formData, shamcash_number: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>إلغاء</Button>
          <Button onClick={handleAddAgent} variant="contained" color="primary">
            إضافة
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Agents;
