app.post('/register', async (req, res) => {
  const { firstName, lastName, age, birthdate, gender, country, bio, username, email, phone, password } = req.body;
  
  const exists = await User.findOne({ $or: [{ username }, { email }, { phone }] });
  if (exists) {
    return res.status(400).json({ message: 'اسم المستخدم او الايميل او الرقم موجود مسبقاً' });
  }
  
  const hashedPass = await bcrypt.hash(password, 10);
  
  const newUser = new User({
    firstName, lastName, age, birthdate, gender, country, bio,
    username, email, phone, password: hashedPass
  });
  
  await newUser.save();
  res.json({ message: 'تم انشاء الحساب بنجاح' });
});
