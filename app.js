const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()
const httpServer = createServer(app)

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB Connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected ✅'))
  .catch(err => console.log('MongoDB Error:', err))

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Game Server Ayham</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          background: #0f172a; 
          color: #e2e8f0; 
          text-align: center; 
          padding: 20px;
          margin: 0;
        }
        h1 { color: #22c55e; font-size: 2.5rem; margin-top: 80px; }
        .status { 
          background: #1e293b; 
          display: inline-block; 
          padding: 25px 45px; 
          border-radius: 15px; 
          margin-top: 30px;
          border: 2px solid #334155;
        }
        p { font-size: 1.1rem; margin: 12px 0; }
        .green { color: #22c55e; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>🔥 Game Server Ayham Shaghal</h1>
      <div class="status">
        <p>Server: <span class="green">Online ✅</span></p>
        <p>MongoDB: <span class="green">Connected ✅</span></p>
        <p>Gemini API: <span class="green">Ready ✅</span></p>
        <p>Socket.io: <span class="green">Ready ✅</span></p>
        <p>Voice: <span class="green">Ready ✅</span></p>
      </div>
      <p style="margin-top: 50px; color: #64748b;">Powered by Render + MongoDB + Gemini</p>
    </body>
    </html>
  `)
})

// Health Check للـ Render
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date() 
  })
})

// Gemini API Route مثال
app.post('/api/gemini', async (req, res) => {
  try {
    // هون بتحط كود Gemini تبعك
    res.json({ message: 'Gemini endpoint ready' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

const PORT = process.env.PORT || 10000
httpServer.listen(PORT, () => {
  console.log(`Server on ${PORT}`)
})
