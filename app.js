app.get('/', (req, res) => {
  res.send(`
    <h1>🔥 Game Server Ayham Shaghal</h1>
    <p>Server: Online ✅</p>
    <p>MongoDB: Connected ✅</p>
    <p>Gemini: Ready ✅</p>
    <p>Socket.io: Ready ✅</p>
  `)
})
