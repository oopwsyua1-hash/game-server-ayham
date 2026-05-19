import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import MicIcon from '@mui/icons-material/Mic';
import PersonIcon from '@mui/icons-material/Person';
import BarChartIcon from '@mui/icons-material/BarChart';

const Sidebar = ({ open }) => {
  const navigate = useNavigate();

  const menuItems = [
    { label: 'لوحة التحكم', icon: <DashboardIcon />, path: '/' },
    { label: 'المستخدمون', icon: <PeopleIcon />, path: '/users' },
    { label: 'الهدايا', icon: <CardGiftcardIcon />, path: '/gifts' },
    { label: 'الغرف', icon: <MicIcon />, path: '/rooms' },
    { label: 'الوكلاء', icon: <PersonIcon />, path: '/agents' },
    { label: 'التقارير', icon: <BarChartIcon />, path: '/reports' },
  ];

  return (
    <Drawer
      open={open}
      variant="persistent"
      sx={{
        width: open ? 280 : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          backgroundColor: '#f5f5f5',
        },
      }}
    >
      <Box sx={{ padding: 2 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(98, 0, 238, 0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#6200EE' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
