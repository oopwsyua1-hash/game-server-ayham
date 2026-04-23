app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>السبع الحلبي - LIVE</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'Cairo', Arial, sans-serif;
          background: #0a0a0a;
          color: #fff;
          text-align: center;
          overflow: hidden;
          height: 100vh;
          animation: shake 0.5s infinite;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-1px); }
          75% { transform: translateX(1px); }
        }
        
        /* خلفية شبكة نيون */
        .neon-grid {
          position: fixed;
          width: 200%;
          height: 200%;
          top: -50%;
          left: -50%;
          background-image: 
            linear-gradient(cyan 2px, transparent 2px),
            linear-gradient(90deg, cyan 2px, transparent 2px);
          background-size: 50px 50px;
          animation: moveGrid 4s linear infinite;
          opacity: 0.15;
          z-index: -1;
        }
        
        @keyframes moveGrid {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
        }
        
        /* توهج دائري */
        .glow {
          position: fixed;
          top: 50%;
          left: 50%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(255,0,128,0.4) 0%, transparent 70%);
          transform: translate(-50%, -50%);
          animation: glowPulse 2s ease-in-out infinite;
          z-index: -1;
        }
        
        @keyframes glowPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.8; }
        }
        
        .container {
          position: relative;
          z-index: 1;
          padding-top: 10vh;
        }
        
        h1 {
          font-size: 4rem;
          font-weight: 900;
          color: #fff;
          text-shadow: 
            0 0 10px #fff,
            0 0 20px #ff0080,
            0 0 30px #ff0080,
            0 0 40px #ff0080;
          animation: heartBeat 1s ease-in-out infinite;
          margin-bottom: 30px;
        }
        
        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.1); }
          50% { transform: scale(1); }
          75% { transform: scale(1.15); }
        }
        
        /* موجات الصوت */
        .waves {
          display: flex;
          justify-content: center;
          gap: 5px;
          height: 60px;
          margin: 20px 0;
        }
        .bar {
          width: 6px;
          background: linear-gradient(to top, #ff0080, #00ffff);
          border-radius: 3px;
          animation: wave 1s ease-in-out infinite;
        }
        .bar:nth-child(1) { animation-delay: 0s; }
        .bar:nth-child(2) { animation-delay: 0.1s; }
        .bar:nth-child(3) { animation-delay: 0.2s; }
        .bar:nth-child(4) { animation-delay: 0.3s; }
        .bar:nth-child(5) { animation-delay: 0.4s; }
        .bar:nth-child(6) { animation-delay: 0.5s; }
        .bar:nth-child(7) { animation-delay: 0.4s; }
        .bar:nth-child(8) { animation-delay: 0.3s; }
        .bar:nth-child(9) { animation-delay: 0.2s; }
        .bar:nth-child(10) { animation-delay: 0.1s; }
        
        @keyframes wave {
          0%, 100% { height: 10px; }
          50% { height: 60px; }
        }
        
        .status {
          background: rgba(10,10,10,0.8);
          backdrop-filter: blur(15px);
          display: inline-block;
          padding: 25px 45px;
          border-radius: 25px;
          border: 3px solid #ff0080;
          box-shadow: 
            0 0 20px #ff0080,
            inset 0 0 20px rgba(255,0,128,0.3);
        }
        
        p {
          font-size: 1.3rem;
          margin: 12px 0;
          font-weight: 700;
        }
        
        .green {
          color: #00ff88;
          text-shadow: 0 0 15px #00ff88;
        }
      </style>
    </head>
    <body>
      <div class="neon-grid"></div>
      <div class="glow"></div>
      
      <div class="container">
        <h1>⚡ السبع الحلبي عم ينبض ⚡</h1>
        
        <div class="waves">
          <div class="bar"></div><div class="bar"></div><div class="bar"></div>
          <div class="bar"></div><div class="bar"></div><div class="bar"></div>
          <div class="bar"></div><div class="bar"></div><div class="bar"></div>
          <div class="bar"></div>
        </div>
        
        <div class="status">
          <p>Server: <span class="green">LIVE 🔥</span></p>
          <p>MongoDB: <span class="green">CONNECTED ✅</span></p>
          <p>Gemini: <span class="green">READY 🤖</span></p>
          <p>Socket.io: <span class="green">ONLINE 📡</span></p>
        </div>
      </div>
    </body>
    </html>
  `)
})
