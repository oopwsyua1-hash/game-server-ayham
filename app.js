// ===== جدول الغرف =====
const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    owner: { type: String, required: true }, // ID صاحب الغرفة
    ownerName: String,
    cover: { type: String, default: 'https://i.imgur.com/party-cover.jpg' },
    isVip: { type: Boolean, default: false },
    users: [{ userId: String, name: String, pic: String, onMic: Boolean, speaking: Boolean }],
    createdAt: { type: Date, default: Date.now }
});
const Room = mongoose.model('Room', roomSchema);

// ===== API جلب كل الغرف =====
app.get('/api/rooms', async (req, res) => {
    try {
        if (mongoose.connection.readyState!== 1) {
            return res.status(503).json({ error: 'قاعدة البيانات مو شغالة حالياً 💎' });
        }
        const rooms = await Room.find().sort({ isVip: -1, createdAt: -1 });
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: 'خطأ بجلب الغرف' });
    }
});

// ===== API انشاء غرفة جديدة =====
app.post('/api/rooms', async (req, res) => {
    try {
        const { name, ownerId, ownerName } = req.body;
        const newRoom = new Room({
            name: name || 'غرفة السبع الحلبي',
            owner: ownerId,
            ownerName: ownerName,
            users: [{ userId: ownerId, name: ownerName, pic: '', onMic: true, speaking: false }]
        });
        await newRoom.save();
        res.json({ success: true, roomId: newRoom._id });
    } catch (err) {
        res.status(500).json({ error: 'ما قدرنا نعمل الغرفة' });
    }
});

// ===== API جلب بيانات غرفة وحدة =====
app.get('/api/room/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ error: 'الغرفة مو موجودة' });
        res.json(room);
    } catch (err) {
        res.status(500).json({ error: 'خطأ بجلب الغرفة' });
    }
});

// ===== صفحة الغرفة الصوتية =====
app.get('/room/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'room.html'));
});
