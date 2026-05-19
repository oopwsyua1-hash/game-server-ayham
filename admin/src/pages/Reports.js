import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const Reports = () => {
  const [loading, setLoading] = useState(true);

  const data = [
    { name: 'الأحد', revenue: 4000, users: 2400 },
    { name: 'الاثنين', revenue: 3000, users: 1398 },
    { name: 'الثلاثاء', revenue: 2000, users: 9800 },
    { name: 'الأربعاء', revenue: 2780, users: 3908 },
    { name: 'الخميس', revenue: 1890, users: 4800 },
    { name: 'الجمعة', revenue: 2390, users: 3800 },
    { name: 'السبت', revenue: 2490, users: 4300 },
  ];

  const giftCategoryData = [
    { name: 'حب', value: 35 },
    { name: 'فخامة', value: 25 },
    { name: 'VIP', value: 20 },
    { name: 'متنوع', value: 20 },
  ];

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];

  useEffect(() => {
    setLoading(false);
  }, []);

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
        التقارير والإحصائيات
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              الإيرادات والمستخدمين (أسبوعي)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#FFC107" />
                <Line type="monotone" dataKey="users" stroke="#6200EE" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              توزيع فئات الهدايا
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={giftCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {giftCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              أداء الإيرادات (تفصيل يومي)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#FFC107" />
                <Bar dataKey="users" fill="#6200EE" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Reports;
