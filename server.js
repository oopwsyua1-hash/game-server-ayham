app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = await User.findOne({ username });
  
  if (!user) {
    return res.status(404).json({ message: 'الحساب غير موجود' });
  }
  
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    return res.status(400).json({ message: 'كلمة السر غلط' });
  }
  
  res.json({ message: 'تم تسجيل الدخول', user });
});
