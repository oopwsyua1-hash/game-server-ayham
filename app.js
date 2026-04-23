const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// تشغيل Gemini بالمفتاح اللي حطيته
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// 1. للتجربة انه شغال
app.get('/', (req, res) => {
  res.send('Game Server Ayham Shaghal 🔥🎮 + Gemini Ready');
});

// 2. API الذكاء الاصطناعي - تطبيقك ببعتله سؤال
app.post('/api/ai', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'ابعث prompt' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ reply: text });
  } catch (error) {
    res.status(500).json({ error: 'خطأ: ' + error.message });
  }
});

// 3. API الغرف - هون بعدين منضيف الشات الصوتي
app.get('/api/rooms', (req, res) => {
  res.json({
    rooms: [
      { id: 1, name: 'غرفة دردشة عامة', users: 0 },
      { id: 2, name: 'غرفة ألعاب', users: 0 }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server on ${PORT}`);
});
