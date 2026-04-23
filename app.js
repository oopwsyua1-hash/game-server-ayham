const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Game Server Ayham Shaghal 🔥🎮");
});

app.post("/api/ai", (req, res) => {
  const { prompt } = req.body || {};
  res.json({ 
    reply: `وصلني: ${prompt}. جاهز نشبك Gemini AI!` 
  });
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Server on ${port}`));
