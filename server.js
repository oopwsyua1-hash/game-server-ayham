const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect('mongodb+srv://ayham:ZcgeeHmqNncajhGk@cluster0.oad1i3x.mongodb.net/sab3?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB ✅'))
  .catch(err => console.error('MongoDB connection error:', err.message));

// ... باقي الكود

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`السبع الحلبي شغال على ${PORT}`);
});
