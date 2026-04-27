import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:math';

// ===========================================
// ⚙️ إعدادات السيرفر - جاهز لسيرفرك
// ===========================================
const String SERVER_URL = "https://game-server-ayham.onrender.com";
const bool PAYMENTS_ENABLED = false;
const String APP_NAME = "دردشة السبع";
const String ADMIN_NAME = "ALSAEB_ADMIN";
const int DAILY_FREE_COINS = 500;
const int VIP_ADS_NEEDED = 2;

void main() => runApp(DardashaAlSabea());

class DardashaAlSabea extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: APP_NAME,
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: Color(0xFF0F0F0F),
        primaryColor: Color(0xFFFFD700),
        appBarTheme: AppBarTheme(backgroundColor: Color(0xFF1A1A1A), elevation: 0),
      ),
      home: AuthScreen(),
    );
  }
}

// ===========================================
// 🌐 كلاس API - مربوط مع سيرفرك مباشرة
// ===========================================
class Api {
  static String? token;
  static Map<String, dynamic>? userData;

  static Future<bool> login(String username, String password) async {
    try {
      final res = await http.post(
        Uri.parse('$SERVER_URL/api/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'password': password}),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        token = data['token'];
        userData = data['user'];
        return true;
      }
    } catch (e) {print(e);}
    return false;
  }

  static Future<bool> register(String username, String password, String gender, String country) async {
    try {
      final res = await http.post(
        Uri.parse('$SERVER_URL/api/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'password': password, 'gender': gender, 'country': country}),
      );
      return res.statusCode == 200;
    } catch (e) {print(e);}
    return false;
  }

  static Future<bool> updateCoins(int coins) async {
    try {
      final res = await http.post(
        Uri.parse('$SERVER_URL/api/update-coins'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({'coins': coins}),
      );
      return res.statusCode == 200;
    } catch (e) {}
    return false;
  }

  static Future<bool> updateXP(int xp, int level) async {
    try {
      final res = await http.post(
        Uri.parse('$SERVER_URL/api/update-xp'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({'xp': xp, 'level': level}),
      );
      return res.statusCode == 200;
    } catch (e) {}
    return false;
  }

  static Future<List> getPosts() async {
    try {
      final res = await http.get(Uri.parse('$SERVER_URL/api/posts'), headers: {'Authorization': 'Bearer $token'});
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) {}
    return [];
  }

  static Future<bool> addPost(String text, String type, String url) async {
    try {
      final res = await http.post(
        Uri.parse('$SERVER_URL/api/posts'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({'text': text, 'type': type, 'url': url}),
      );
      return res.statusCode == 200;
    } catch (e) {}
    return false;
  }

  static Future<bool> likePost(String postId) async {
    try {
      final res = await http.post(Uri.parse('$SERVER_URL/api/posts/$postId/like'), headers: {'Authorization': 'Bearer $token'});
      return res.statusCode == 200;
    } catch (e) {}
    return false;
  }

  static Future<List> getRooms() async {
    try {
      final res = await http.get(Uri.parse('$SERVER_URL/api/rooms'), headers: {'Authorization': 'Bearer $token'});
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) {}
    return [
      {'_id': '1', 'name': 'روم السباع الملكي 👑', 'users': 23, 'vip': true},
      {'_id': '2', 'name': 'ضحك وفرفشة 😂', 'users': 45, 'vip': false},
      {'_id': '3', 'name': 'كرسي الاعتراف 🎤', 'users': 12, 'vip': false},
      {'_id': '4', 'name': 'تحديات سباع 🔥', 'users': 8, 'vip': false},
    ];
  }

  static Future<bool> joinRoom(String roomId) async {
    try {
      final res = await http.post(Uri.parse('$SERVER_URL/api/rooms/$roomId/join'), headers: {'Authorization': 'Bearer $token'});
      return res.statusCode == 200;
    } catch (e) {}
    return false;
  }

  static Future<bool> watchAd() async {
    try {
      final res = await http.post(Uri.parse('$SERVER_URL/api/watch-ad'), headers: {'Authorization': 'Bearer $token'});
      return res.statusCode == 200;
    } catch (e) {}
    return false;
  }

  static Future<bool> redeemCode(String code) async {
    try {
      final res = await http.post(
        Uri.parse('$SERVER_URL/api/redeem-code'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({'code': code}),
      );
      return res.statusCode == 200;
    } catch (e) {}
    return false;
  }
}

// ===========================================
// 🔑 شاشة تسجيل الدخول
// ===========================================
class AuthScreen extends StatefulWidget {
  @override
  _AuthScreenState createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool isLogin = true, loading = false;
  TextEditingController nameCtrl = TextEditingController();
  TextEditingController passCtrl = TextEditingController();
  String selectedGender = "ذكر";
  String selectedCountry = "السعودية";
  List<String> countries = ["السعودية", "الامارات", "الكويت", "قطر", "البحرين", "عمان", "مصر", "الاردن", "لبنان", "سوريا", "العراق", "تركيا", "الجزائر", "المغرب", "تونس"];

  void _submit() async {
    if (nameCtrl.text.trim().isEmpty || passCtrl.text.length < 3) {
      _showMsg('اكتب اسم وباسوورد 3 احرف عالاقل', false);
      return;
    }
    setState(() => loading = true);
    bool success = isLogin
     ? await Api.login(nameCtrl.text.trim(), passCtrl.text)
        : await Api.register(nameCtrl.text.trim(), passCtrl.text, selectedGender, selectedCountry);
    setState(() => loading = false);
    if (success) {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => MainScreen()));
    } else {
      _showMsg(isLogin? 'اسم او باسوورد غلط' : 'الحساب موجود او خطأ بالتسجيل', false);
    }
  }

  void _showMsg(String msg, bool success) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: success? Colors.green : Colors.red));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFF1A1A1A), Color(0xFF0F0F0F)])),
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.pets, size: 100, color: Color(0xFFFFD700)),
                SizedBox(height: 20),
                Text(APP_NAME, style: TextStyle(fontSize: 36, color: Color(0xFFFFD700), fontWeight: FontWeight.bold)),
                Text("عرين السباع بانتظارك", style: TextStyle(color: Colors.grey)),
                SizedBox(height: 30),
                Container(
                  padding: EdgeInsets.all(20),
                  decoration: BoxDecoration(color: Color(0xFF1A1A1A), borderRadius: BorderRadius.circular(16), border: Border.all(color: Color(0xFFFFD700).withOpacity(0.3))),
                  child: Column(
                    children: [
                      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        _tabBtn("تسجيل دخول", isLogin, () => setState(() => isLogin = true)),
                        SizedBox(width: 20),
                        _tabBtn("انشاء حساب",!isLogin, () => setState(() => isLogin = false)),
                      ]),
                      SizedBox(height: 20),
                      TextField(controller: nameCtrl, style: TextStyle(color: Colors.white), decoration: _inputDec("اسم المستخدم")),
                      SizedBox(height: 12),
                      TextField(controller: passCtrl, obscureText: true, style: TextStyle(color: Colors.white), decoration: _inputDec("كلمة السر")),
                      if (!isLogin)...[
                        SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: selectedGender,
                          dropdownColor: Color(0xFF1A1A1A),
                          style: TextStyle(color: Colors.white),
                          decoration: _inputDec("الجنس"),
                          items: ["ذكر", "انثى"].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                          onChanged: (val) => setState(() => selectedGender = val!),
                        ),
                        SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: selectedCountry,
                          dropdownColor: Color(0xFF1A1A1A),
                          style: TextStyle(color: Colors.white),
                          decoration: _inputDec("البلد"),
                          items: countries.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                          onChanged: (val) => setState(() => selectedCountry = val!),
                        ),
                      ],
                      SizedBox(height: 20),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: Color(0xFFFFD700), minimumSize: Size(double.infinity, 50), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                        onPressed: loading? null : _submit,
                        child: loading? CircularProgressIndicator(color: Colors.black) : Text(isLogin? "دخول" : "انشاء حساب + $DAILY_FREE_COINS كوينز", style: TextStyle(color: Colors.black, fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _tabBtn(String text, bool active, VoidCallback onTap) => GestureDetector(onTap: onTap, child: Text(text, style: TextStyle(color: active? Color(0xFFFFD700) : Colors.grey, fontSize: 16, fontWeight: active? FontWeight.bold : FontWeight.normal)));
  InputDecoration _inputDec(String hint) => InputDecoration(hintText: hint, hintStyle: TextStyle(color: Colors.grey), filled: true, fillColor: Color(0xFF0F0F0F), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none));
}

// ===========================================
// 🏠 الشاشة الرئيسية - 6 اقسام كاملة
// ===========================================
class MainScreen extends StatefulWidget {
  @override
  _MainScreenState createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int currentIndex = 2;
  Map<String, dynamic> user = Api.userData!;
  late int coins;
  late bool isVip;
  late bool isAdmin;
  late int level;
  late int xp;
  int vipAdCount = 0;

  @override
  void initState() {
    super.initState();
    coins = user['coins']?? DAILY_FREE_COINS;
    isVip = user['isVip']?? false;
    isAdmin = user['username'] == ADMIN_NAME;
    level = user['level']?? 1;
    xp = user['xp']?? 0;
  }

  void addXp(int amount) async {
    setState(() {
      xp += amount;
      if (xp >= level * 100) {
        level++;
        xp = 0;
        _showMsg('لفل اب! صرت لفل $level 🎉', true);
      }
    });
    await Api.updateXP(xp, level);
  }

  void updateCoins(int newCoins) async {
    setState(() => coins = newCoins);
    await Api.updateCoins(coins);
  }

  void _watchAdForVip() async {
    bool success = await Api.watchAd();
    if (success) {
      setState(() {
        vipAdCount++;
        if (vipAdCount >= VIP_ADS_NEEDED) {
          isVip = true;
          vipAdCount = 0;
          _showMsg('مبروك! صرت VIP 24 ساعة 🦁', true);
        } else {
          _showMsg('شاهد ${VIP_ADS_NEEDED - vipAdCount} اعلان كمان', false);
        }
      });
    }
  }

  void _showMsg(String msg, bool success) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: success? Colors.green : Colors.orange));

  @override
  Widget build(BuildContext context) {
    final screens = [
      ProfileTab(user: user, coins: coins, level: level, xp: xp, isVip: isVip, isAdmin: isAdmin),
      GamesTab(username: user['username'], coins: coins, updateCoins: updateCoins, addXp: addXp),
      RoomsTab(username: user['username'], userId: user['id'].toString(), coins: coins, isVip: isVip, isAdmin: isAdmin, updateCoins: updateCoins, addXp: addXp, watchAd: _watchAdForVip),
      ChatTab(username: user['username']),
      PostsTab(username: user['username'], isAdmin: isAdmin),
      AppCenterTab(username: user['username'], coins: coins, isAdmin: isAdmin, updateCoins: updateCoins),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Row(children: [Icon(Icons.pets, color: Color(0xFFFFD700)), SizedBox(width: 8), Text(APP_NAME, style: TextStyle(color: Color(0xFFFFD700), fontWeight: FontWeight.bold))]),
        actions: [
          if (isAdmin) Icon(Icons.admin_panel_settings, color: Colors.red),
          if (isVip) Padding(padding: EdgeInsets.only(right: 8), child: Chip(label: Text("VIP"), backgroundColor: Colors.amber, labelStyle: TextStyle(fontSize: 10))),
          Center(child: Padding(padding: EdgeInsets.all(16), child: Text('$coins 🪙', style: TextStyle(color: Color(0xFFFFD700), fontSize: 16)))),
        ],
      ),
      body: screens[currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentIndex, onTap: (i) => setState(() => currentIndex = i), type: BottomNavigationBarType.fixed,
        backgroundColor: Color(0xFF1A1A1A), selectedItemColor: Color(0xFFFFD700), unselectedItemColor: Colors.grey, selectedFontSize: 11, unselectedFontSize: 11,
        items: [
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'انا'),
          BottomNavigationBarItem(icon: Icon(Icons.sports_esports), label: 'الالعاب'),
          BottomNavigationBarItem(icon: Icon(Icons.mic), label: 'الرومات'),
          BottomNavigationBarItem(icon: Icon(Icons.chat), label: 'الدردشة'),
          BottomNavigationBarItem(icon: Icon(Icons.article), label: 'المناشير'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'المركز'),
        ],
      ),
    );
  }
}

// ===========================================
// 👤 قسم انا
// ===========================================
class ProfileTab extends StatelessWidget {
  final Map<String, dynamic> user; final int coins, level, xp; final bool isVip, isAdmin;
  ProfileTab({required this.user, required this.coins, required this.level, required this.xp, required this.isVip, required this.isAdmin});
  @override
  Widget build(BuildContext context) {
    return ListView(padding: EdgeInsets.all(16), children: [
      Center(child: CircleAvatar(radius: 50, backgroundColor: Color(0xFFFFD700), child: Text(user['username'][0].toUpperCase(), style: TextStyle(fontSize: 40, color: Colors.black)))),
      SizedBox(height: 16),
      Center(child: Text(user['username'], style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold))),
      Center(child: Text(isAdmin? "مالك التطبيق 👑" : isVip? "شبل السبع VIP" : "عضو", style: TextStyle(color: Color(0xFFFFD700)))),
      SizedBox(height: 20),
      _infoCard("الكوينزات", "$coins 🪙"), _infoCard("المستوى", "لفل $level"), _infoCard("الخبرة", "$xp / ${level * 100} XP"), _infoCard("الجنس", user['gender']?? "غير محدد"), _infoCard("البلد", user['country']?? "غير محدد"), _infoCard("ID", "${user['id']}"), _infoCard("تاريخ التسجيل", user['createdAt']?.toString().substring(0, 10)?? "غير محدد"),
    ]);
  }
  Widget _infoCard(String title, String value) => Card(color: Color(0xFF1A1A1A), child: ListTile(title: Text(title, style: TextStyle(color: Colors.grey)), trailing: Text(value, style: TextStyle(color: Color(0xFFFFD700), fontWeight: FontWeight.bold))));
}

// ===========================================
// 🎮 قسم الالعاب - 8 العاب
// ===========================================
class GamesTab extends StatefulWidget {
  final String username; final int coins; final Function(int) updateCoins, addXp;
  GamesTab({required this.username, required this.coins, required this.updateCoins, required this.addXp});
  @override
  _GamesTabState createState() => _GamesTabState();
}

class _GamesTabState extends State<GamesTab> {
  Random rand = Random();
  void _playGame(String game, int win) {
    widget.updateCoins(widget.coins + win); widget.addXp(10);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$game: ربحت $win كوينز + 10 XP'), backgroundColor: Colors.green));
  }

  @override
  Widget build(BuildContext context) {
    return ListView(padding: EdgeInsets.all(16), children: [
      Text("العاب الحظ والربح", style: TextStyle(color: Color(0xFFFFD700), fontSize: 20, fontWeight: FontWeight.bold)),
      SizedBox(height: 12),
      GridView.count(
        crossAxisCount: 2, shrinkWrap: true, physics: NeverScrollableScrollPhysics(), crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.1,
        children: [
          _gameCard("عجلة الحظ", "🎡", "0-500 كوينز", () => _playGame("عجلة الحظ", [0,10,50,100,200,500][rand.nextInt(6)])),
          _gameCard("حجر ورقة", "✂️", "50 كوينز", () => _playGame("حجر ورقة مقص", 50)),
          _gameCard("النرد", "🎲", "20-120 كوينز", () => _playGame("النرد", (rand.nextInt(6) + 1) * 20)),
          _gameCard("الرقم السري", "🔢", "200 كوينز", () => _playGame("الرقم السري", 200)),
        ],
      ),
      SizedBox(height: 20),
      Text("العاب المهارة", style: TextStyle(color: Color(0xFFFFD700), fontSize: 20, fontWeight: FontWeight.bold)),
      SizedBox(height: 12),
      GridView.count(
        crossAxisCount: 2, shrinkWrap: true, physics: NeverScrollableScrollPhysics(), crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.1,
        children: [
          _gameCard("الاسئلة", "🧠", "100 كوينز", () => _playGame("الاسئلة", 100)),
          _gameCard("الكنز", "💎", "0-300 كوينز", () => _playGame("الكنز", rand.nextInt(300))),
          _gameCard("السباق", "🐎", "150 كوينز", () => _playGame("السباق", 150)),
          _gameCard("الحظ", "🍀", "0-1000 كوينز", () => _playGame("الحظ", rand.nextInt(1000))),
        ],
      ),
    ]);
  }

  Widget _gameCard(String name, String emoji, String reward, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF1A1A1A), Color(0xFF2A2A2A)]),
            borderRadius: BorderRadius.circular(16), border: Border.all(color: Color(0xFFFFD700).withOpacity(0.3), width: 1),
            boxShadow: [BoxShadow(color: Color(0xFFFFD700).withOpacity(0.1), blurRadius: 8, spreadRadius: 1)],
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text(emoji, style: TextStyle(fontSize: 50)),
            SizedBox(height: 8),
            Text(name, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            SizedBox(height: 4),
            Container(padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: Color(0xFFFFD700).withOpacity(0.2), borderRadius: BorderRadius.circular(8)), child: Text(reward, style: TextStyle(color: Color(0xFFFFD700), fontSize: 11))),
          ]),
        ),
      );
}

// ===========================================
// 🎤 قسم الرومات
// ===========================================
class RoomsTab extends StatefulWidget {
  final String username; final String userId; final int coins; final bool isVip, isAdmin; final Function(int) updateCoins, addXp, watchAd;
  RoomsTab({required this.username, required this.userId, required this.coins, required this.isVip, required this.isAdmin, required this.updateCoins, required this.addXp, required this.watchAd});
  @override
  _RoomsTabState createState() => _RoomsTabState();
}

class _RoomsTabState extends State<RoomsTab> {
  List rooms = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadRooms();
  }

  void _loadRooms() async {
    rooms = await Api.getRooms();
    setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return Center(child: CircularProgressIndicator(color: Color(0xFFFFD700)));
    return Column(children: [
      if (!widget.isVip &&!widget.isAdmin)
        GestureDetector(
          onTap: () => widget.watchAd(),
          child: Container(margin: EdgeInsets.all(12), padding: EdgeInsets.all(16), decoration: BoxDecoration(gradient: LinearGradient(colors: [Color(0xFFFFD700), Color(0xFFFF8C00)]), borderRadius: BorderRadius.circular(12)), child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.play_circle_fill, color: Colors.black), SizedBox(width: 8), Text("شاهد اعلانين وخد تاج السبع", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold))])),
        ),
      Expanded(child: ListView.builder(itemCount: rooms.length, itemBuilder: (context, index) {
        final room = rooms[index];
        return ListTile(
          leading: CircleAvatar(backgroundColor: Color(0xFFFFD700), child: Icon(Icons.mic, color: Colors.black)),
          title: Text(room['name'], style: TextStyle(color: Colors.white)),
          subtitle: Text("${room['users']} متواجد", style: TextStyle(color: Colors.grey, fontSize: 12)),
          trailing: room['vip']? Icon(Icons.workspace_premium, color: Color(0xFFFFD700)) : null,
          onTap: () async {
            if (room['vip'] &&!widget.isVip &&!widget.isAdmin) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('هاد روم VIP يا سبع'), backgroundColor: Colors.orange));
              return;
            }
            await Api.joinRoom(room['_id']);
            Navigator.push(context, MaterialPageRoute(builder: (_) => RoomScreen(roomName: room['name'], roomId: room['_id'], username: widget.username, userId: widget.userId, coins: widget.coins, isVip: widget.isVip, isAdmin: widget.isAdmin, updateCoins: widget.updateCoins, addXp: widget.addXp)));
          },
        );
      })),
    ]);
  }
}

// ===========================================
// 💬 قسم الدردشة
// ===========================================
class ChatTab extends StatefulWidget {
  final String username; ChatTab({required this.username}); @override _ChatTabState createState() => _ChatTabState();
}
class _ChatTabState extends State<ChatTab> {
  List<String> messages = ["النظام: اهلا بكم في الدردشة العامة"]; TextEditingController msgCtrl = TextEditingController();
  void _send() {if (msgCtrl.text.trim().isEmpty) return; setState(() {messages.add("${widget.username}: ${msgCtrl.text}"); msgCtrl.clear();});}
  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Expanded(child: ListView.builder(reverse: true, itemCount: messages.length, itemBuilder: (context, i) => Padding(padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4), child: Text(messages[messages.length - 1 - i], style: TextStyle(color: Colors.white))))),
      Container(color: Color(0xFF1A1A1A), padding: EdgeInsets.all(8), child: Row(children: [Expanded(child: TextField(controller: msgCtrl, style: TextStyle(color: Colors.white), decoration: InputDecoration(hintText: "اكتب رسالة...", hintStyle: TextStyle(color: Colors.grey), border: InputBorder.none), onSubmitted: (_) => _send())), IconButton(icon: Icon(Icons.send, color: Color(0xFFFFD700)), onPressed: _send)])),
    ]);
  }
}

// ===========================================
// 📝 قسم المناشير
// ===========================================
class PostsTab extends StatefulWidget {
  final String username; final bool isAdmin; PostsTab({required this.username, required this.isAdmin}); @override _PostsTabState createState() => _PostsTabState();
}
class _PostsTabState extends State<PostsTab> {
  List posts = [];
  TextEditingController postCtrl = TextEditingController();
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  void _loadPosts() async {
    posts = await Api.getPosts();
    setState(() => loading = false);
  }

  void _addPost() async {
    if (postCtrl.text.trim().isEmpty) return;
    bool success = await Api.addPost(postCtrl.text, "text", "");
    if (success) {
      postCtrl.clear();
      _loadPosts();
    }
  }

  void _likePost(String id, int index) async {
    await Api.likePost(id);
    _loadPosts();
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return Center(child: CircularProgressIndicator(color: Color(0xFFFFD700)));
    return Column(children: [
      Container(color: Color(0xFF1A1A1A), padding: EdgeInsets.all(12), child: Row(children: [Expanded(child: TextField(controller: postCtrl, style: TextStyle(color: Colors.white), decoration: InputDecoration(hintText: "اكتب منشور...", hintStyle: TextStyle(color: Colors.grey), border: InputBorder.none))), ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: Color(0xFFFFD700)), onPressed: _addPost, child: Text("نشر", style: TextStyle(color: Colors.black)))])),
      Expanded(child: ListView.builder(itemCount: posts.length, itemBuilder: (context, i) {
        final p = posts[i];
        return Card(color: Color(0xFF1A1A1A), margin: EdgeInsets.symmetric(horizontal: 12, vertical: 6), child: Padding(padding: EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [CircleAvatar(backgroundColor: Color(0xFFFFD700), radius: 16, child: Text(p["username"][0], style: TextStyle(color: Colors.black, fontSize: 12))), SizedBox(width: 8), Text(p["username"], style: TextStyle(color: Color(0xFFFFD700), fontWeight: FontWeight.bold)), if (p["username"] == ADMIN_NAME) Icon(Icons.verified, color: Colors.blue, size: 16)]),
          SizedBox(height: 8), Text(p["text"], style: TextStyle(color: Colors.white)),
          SizedBox(height: 8), Row(children: [IconButton(icon: Icon(Icons.favorite, color: Colors.red, size: 16), onPressed: () => _likePost(p["_id"], i)), SizedBox(width: 4), Text("${p["likes"]}", style: TextStyle(color: Colors.grey))]),
        ])));
      })),
    ]);
  }
}

// ===========================================
// ⚙️ مركز التطبيق
// ===========================================
class AppCenterTab extends StatefulWidget {
  final String username; final int coins; final bool isAdmin; final Function(int) updateCoins;
  AppCenterTab({required this.username, required this.coins, required this.isAdmin, required this.updateCoins});
  @override
  _AppCenterTabState createState() => _AppCenterTabState();
}

class _AppCenterTabState extends State<AppCenterTab> {
  TextEditingController codeCtrl = TextEditingController();

  void _showComingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$feature - قريباً بعد الترخيص 🦁'), backgroundColor: Colors.orange));
  }

  void _redeemCode() async {
    if (codeCtrl.text.trim().isEmpty) return;
    bool success = await Api.redeemCode(codeCtrl.text.trim());
    if (success) {
      _showMsg('تم شحن الكود بنجاح!', true);
      codeCtrl.clear();
    } else {
      _showMsg('كود غلط او مستخدم', false);
    }
  }

  void _showMsg(String msg, bool success) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: success? Colors.green : Colors.red));

  @override
  Widget build(BuildContext context) {
    return ListView(padding: EdgeInsets.all(16), children: [
      Text("مركز التطبيق", style: TextStyle(color: Color(0xFFFFD700), fontSize: 24, fontWeight: FontWeight.bold)),
      SizedBox(height: 8),
      Text("كل الاعدادات والخدمات بمكان واحد", style: TextStyle(color: Colors.grey, fontSize: 12)),
      SizedBox(height: 20),
      _sectionTitle("💰 المحفظة والشحن"),
      _settingCard(Icons.monetization_on, "رصيدك الحالي", "${widget.coins} كوينز", Color(0xFFFFD700), () {}),
      _settingCard(Icons.add_circle, "شحن كوينزات", PAYMENTS_ENABLED? "متاح" : "قريباً بعد الترخيص", Colors.green, () => _showComingSoon(context, "الشحن")),
      _settingCard(Icons.account_balance_wallet, "سحب ارباح", PAYMENTS_ENABLED? "متاح" : "قريباً بعد الترخيص", Colors.blue, () => _showComingSoon(context, "السحب")),
      Card(color: Color(0xFF1A1A1A), margin: EdgeInsets.only(bottom: 8), child: Padding(padding: EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [Icon(Icons.card_giftcard, color: Colors.purple), SizedBox(width: 12), Text("اكواد الهدايا", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))]),
        SizedBox(height: 8),
        Row(children: [Expanded(child: TextField(controller: codeCtrl, style: TextStyle(color: Colors.white), decoration: InputDecoration(hintText: "ادخل الكود", hintStyle: TextStyle(color: Colors.grey), filled: true, fillColor: Color(0xFF0F0F0F), border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none)))), SizedBox(width: 8), ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: Color(0xFFFFD700)), onPressed: _redeemCode, child: Text("شحن", style: TextStyle(color: Colors.black)))]),
      ]))),
      SizedBox(height: 20),
      _sectionTitle("⚙️ الاعدادات"),
      _settingCard(Icons.notifications, "الاشعارات", "مفعلة", Colors.orange, () => _showComingSoon(context, "الاشعارات")),
      _settingCard(Icons.lock, "الخصوصية", "اعدادات الحساب", Colors.red, () => _showComingSoon(context, "الخصوصية")),
      _settingCard(Icons.language, "اللغة", "العربية", Colors.teal, () => _showComingSoon(context, "تغيير اللغة")),
      _settingCard(Icons.help, "الدعم الفني", "تواصل معنا", Colors.cyan, () => _showComingSoon(context, "الدعم")),
      SizedBox(height: 20),
      _sectionTitle("📱 عن التطبيق"),
      _settingCard(Icons.info, "اصدار التطبيق", "v1.0.0", Colors.grey, () {}),
      _settingCard(Icons.description, "الشروط والاحكام", "اقرأ", Colors.grey, () => _showComingSoon(context, "الشروط")),
      _settingCard(Icons.privacy_tip, "سياسة الخصوصية", "اق
