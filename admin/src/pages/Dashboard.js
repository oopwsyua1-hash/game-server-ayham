import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../utils/api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const usersRes = await api.get('/api/rooms');
      setData({
        totalUsers: usersRes.data.length || 0,
        totalRooms: usersRes.data.length || 0,
        activeUsers: Math.floor((usersRes.data.length || 0) * 0.6),
        dailyRevenue: Math.random() * 10000,
        chartData: [
          { name: 'يناير', users: 400, revenue: 2400 },
          { name: 'فبراير', users: 300, revenue: 1398 },
          { name: 'مارس', users: 200, revenue: 9800 },
          { name: 'أبريل', users: 278, revenue: 3908 },
          { name: 'مايو', users: 189, revenue: 4800 },
        ],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
        لوحة التحكم الرئيسية
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ padding: 2, textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              إجمالي المستخدمين
            </Typography>
            <Typography variant="h4" sx={{ color: '#6200EE' }}>
              {data?.totalUsers || 0}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ padding: 2, textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              الغرف النشطة
            </Typography>
            <Typography variant="h4" sx={{ color: '#03DAC5' }}>
              {data?.totalRooms || 0}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ padding: 2, textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              المستخدمون النشطون
            </Typography>
            <Typography variant="h4" sx={{ color: '#FF5252' }}>
              {data?.activeUsers || 0}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ padding: 2, textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              الإيرادات اليومية
            </Typography>
            <Typography variant="h4" sx={{ color: '#FFC107' }}>
              ${(data?.dailyRevenue || 0).toFixed(0)}
            </Typography>
          </Paper>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              إحصائيات المستخدمين والإيرادات
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#6200EE" />
                <Line type="monotone" dataKey="revenue" stroke="#FFC107" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              أداء الإيرادات
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#FFC107" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
