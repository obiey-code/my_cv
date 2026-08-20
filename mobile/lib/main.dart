import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(const LukaMosalaApp());
}

class ApiService {
  static const String baseUrl = 'https://luka-mosala-backend.onrender.com';
  static String? authToken;

  // In-memory cache for API requests with 15-second TTL
  static final Map<String, dynamic> _cache = {};
  static final Map<String, DateTime> _cacheExpiry = {};

  static Map<String, String> get headers => {
        'Content-Type': 'application/json',
        if (authToken != null) 'Authorization': 'Bearer $authToken',
      };

  static bool _isCacheValid(String key) {
    if (_cache.containsKey(key) && _cacheExpiry.containsKey(key)) {
      return DateTime.now().isBefore(_cacheExpiry[key]!);
    }
    return false;
  }

  static void _setCache(String key, dynamic data) {
    _cache[key] = data;
    _cacheExpiry[key] = DateTime.now().add(const Duration(seconds: 15));
  }

  static void invalidateCache() {
    _cache.clear();
    _cacheExpiry.clear();
  }

  static Future<bool> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/login/'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        authToken = data['access'];
        return true;
      } else {
        final regResponse = await http.post(
          Uri.parse('$baseUrl/api/auth/register/'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'username': username,
            'password': password,
            'email': '$username@lukamosala.cg',
            'first_name': username == 'admin' ? 'Admin' : 'Utilisateur',
            'last_name': 'Luka Mosala',
          }),
        );
        if (regResponse.statusCode == 201) {
          final data = jsonDecode(regResponse.body);
          authToken = data['access'];
          return true;
        }
      }
    } catch (e) {
      debugPrint('Login error: $e');
    }
    return false;
  }

  static Future<Map<String, dynamic>?> fetchSubscription() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/subscriptions/me/'),
        headers: headers,
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Fetch subscription error: $e');
    }
    return null;
  }

  static Future<List<dynamic>> fetchPlans() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/subscriptions/plans/'),
        headers: headers,
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Fetch plans error: $e');
    }
    return [];
  }

  static Future<List<dynamic>> fetchPackages({bool forceRefresh = false}) async {
    const cacheKey = 'packages';
    if (!forceRefresh && _isCacheValid(cacheKey)) {
      return _cache[cacheKey] as List<dynamic>;
    }

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/jobs/packages/'),
        headers: headers,
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as List<dynamic>;
        _setCache(cacheKey, data);
        return data;
      }
    } catch (e) {
      debugPrint('Fetch packages error: $e');
    }
    return [];
  }

  static Future<bool> generateApplication(String rawText, String sourceUrl, {String? fileName}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/jobs/offers/'),
        headers: headers,
        body: jsonEncode({
          'source_type': sourceUrl.isNotEmpty ? 'URL' : (fileName != null ? 'FILE' : 'TEXT'),
          'source_url': sourceUrl,
          'raw_text': rawText,
          if (fileName != null) 'file_name': fileName,
        }),
      );
      return response.statusCode == 201;
    } catch (e) {
      debugPrint('Generate error: $e');
    }
    return false;
  }

  static Future<bool> payMobileMoney(int planId, String method, String phone) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/subscriptions/pay/'),
        headers: headers,
        body: jsonEncode({
          'plan_id': planId,
          'payment_method': method,
          'phone_number': phone,
        }),
      );
      return response.statusCode == 201;
    } catch (e) {
      debugPrint('Payment error: $e');
    }
    return false;
  }

  static Future<Map<String, dynamic>?> fetchProfileInfo() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/api/profile/info/'), headers: headers);
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) { debugPrint('Error profile info: $e'); }
    return null;
  }

  static Future<Map<String, dynamic>?> fetchProfile() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/api/profile/'), headers: headers);
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) { debugPrint('Error profile: $e'); }
    return null;
  }

  static Future<bool> deleteProfilePhoto() async {
    try {
      final res = await http.delete(Uri.parse('$baseUrl/api/profile/crop-photo/'), headers: headers);
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<bool> uploadProfilePhoto(String photoType) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/api/profile/crop-photo/'),
        headers: headers,
        body: jsonEncode({'action': photoType}),
      );
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<bool> saveProfileInfo(Map<String, dynamic> data) async {
    try {
      final res = await http.patch(Uri.parse('$baseUrl/api/profile/info/'), headers: headers, body: jsonEncode(data));
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<List<dynamic>> fetchSection(String section) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/api/profile/$section/'), headers: headers);
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) { debugPrint('Error section $section: $e'); }
    return [];
  }

  static Future<bool> addSectionItem(String section, Map<String, dynamic> data) async {
    try {
      final res = await http.post(Uri.parse('$baseUrl/api/profile/$section/'), headers: headers, body: jsonEncode(data));
      return res.statusCode == 201;
    } catch (e) { return false; }
  }

  static Future<bool> updateSectionItem(String section, int id, Map<String, dynamic> data) async {
    try {
      final res = await http.put(Uri.parse('$baseUrl/api/profile/$section/$id/'), headers: headers, body: jsonEncode(data));
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<bool> deleteSectionItem(String section, int id) async {
    try {
      final res = await http.delete(Uri.parse('$baseUrl/api/profile/$section/$id/'), headers: headers);
      return res.statusCode == 204;
    } catch (e) { return false; }
  }
}

class LukaMosalaApp extends StatelessWidget {
  const LukaMosalaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI JobApply SaaS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0B1F3A),
          primary: const Color(0xFF0B1F3A),
          secondary: const Color(0xFF185FA5),
        ),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0B1F3A),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: const LoginOrMainScreen(),
    );
  }
}

class LoginOrMainScreen extends StatefulWidget {
  const LoginOrMainScreen({super.key});

  @override
  State<LoginOrMainScreen> createState() => _LoginOrMainScreenState();
}

class _LoginOrMainScreenState extends State<LoginOrMainScreen> {
  bool _isLoggedIn = false;
  bool _isLoading = false;
  final _usernameController = TextEditingController(text: 'admin');
  final _passwordController = TextEditingController(text: 'admin1234');
  String? _errorMessage;

  void _handleLogin() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final success = await ApiService.login(
      _usernameController.text,
      _passwordController.text,
    );

    setState(() {
      _isLoading = false;
      _isLoggedIn = success;
      if (!success) {
        _errorMessage = 'Identifiants incorrects ou serveur indisponible.';
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoggedIn) {
      return const MainTabScreen();
    }

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF185FA5),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(Icons.work, color: Colors.white, size: 36),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'AI JobApply SaaS',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF0B1F3A)),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Générateur automatique de candidatures sur mesure',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFF444441), fontSize: 13),
                    ),
                    const SizedBox(height: 24),
                    if (_errorMessage != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          border: Border.all(color: Colors.red.shade200),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _errorMessage!,
                          style: TextStyle(color: Colors.red.shade800, fontSize: 13),
                        ),
                      ),
                    TextField(
                      controller: _usernameController,
                      decoration: const InputDecoration(
                        labelText: 'Nom d\'utilisateur',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.person),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'Mot de passe',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.lock),
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleLogin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF185FA5),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : const Text('Se connecter / S\'inscrire', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      '💡 Compte par défaut: admin / admin1234',
                      style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class MainTabScreen extends StatefulWidget {
  const MainTabScreen({super.key});

  @override
  State<MainTabScreen> createState() => _MainTabScreenState();
}

class _MainTabScreenState extends State<MainTabScreen> {
  int _currentIndex = 0;
  int _creditsRemaining = 1;

  @override
  void initState() {
    super.initState();
    _loadSubscription();
  }

  void _loadSubscription() async {
    final sub = await ApiService.fetchSubscription();
    if (sub != null && sub.containsKey('credits_remaining')) {
      setState(() {
        _creditsRemaining = sub['credits_remaining'];
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> tabs = [
      DashboardTab(onRefresh: _loadSubscription, onSwitchTab: (index) => setState(() => _currentIndex = index)),
      CreateApplicationTab(onGenerated: _loadSubscription),
      const StructuredProfileTab(),
      PaymentsTab(onPaid: _loadSubscription),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'AI JobApply SaaS',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF185FA5),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                const Icon(Icons.stars, color: Colors.amber, size: 18),
                const SizedBox(width: 6),
                Text(
                  '$_creditsRemaining Crédit(s)',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ],
            ),
          )
        ],
      ),
      body: tabs[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        selectedItemColor: const Color(0xFF185FA5),
        unselectedItemColor: Colors.grey[600],
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Candidatures'),
          BottomNavigationBarItem(icon: Icon(Icons.auto_awesome_outlined), activeIcon: Icon(Icons.auto_awesome), label: 'Générer'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profil'),
          BottomNavigationBarItem(icon: Icon(Icons.credit_card_outlined), activeIcon: Icon(Icons.credit_card), label: 'Abonnement'),
        ],
      ),
    );
  }
}

class DashboardTab extends StatefulWidget {
  final VoidCallback onRefresh;
  final Function(int) onSwitchTab;
  const DashboardTab({super.key, required this.onRefresh, required this.onSwitchTab});

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  List<dynamic> _packages = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPackages();
  }

  void _loadPackages() async {
    setState(() => _isLoading = true);
    final list = await ApiService.fetchPackages();
    setState(() {
      _packages = list;
      _isLoading = false;
    });
    widget.onRefresh();
  }

  // Preview Modal for CV, LM and Email styled harmoniously
  void _openDetailModal(dynamic pkg, String docType) {
    final offer = pkg['job_offer'] ?? {};
    final paymentStatus = pkg['payment_status'] ?? 'approuved';
    final processingStatus = pkg['processing_status'] ?? 'finalized';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    'Aperçu $docType - ${offer['title'] ?? 'Poste'}',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0B1F3A)),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close)),
              ],
            ),
            const Divider(),
            const SizedBox(height: 12),
            Row(
              children: [
                const Text('Status Paiement: ', style: TextStyle(fontWeight: FontWeight.bold)),
                Chip(
                  label: Text(paymentStatus, style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold)),
                  backgroundColor: paymentStatus == 'approuved' ? Colors.green : Colors.orange,
                  padding: EdgeInsets.zero,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Text('Status Traitement: ', style: TextStyle(fontWeight: FontWeight.bold)),
                Chip(
                  label: Text(processingStatus, style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold)),
                  backgroundColor: processingStatus == 'finalized' ? Colors.blue : Colors.orange,
                  padding: EdgeInsets.zero,
                ),
              ],
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Consultation du $docType en cours...')));
              },
              icon: const Icon(Icons.remove_red_eye_outlined, color: Colors.white),
              label: Text('Consulter $docType', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0B1F3A), padding: const EdgeInsets.symmetric(vertical: 14)),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Téléchargement du $docType en cours...')));
              },
              icon: const Icon(Icons.download_outlined, color: Color(0xFF0B1F3A)),
              label: Text('Télécharger $docType', style: const TextStyle(color: Color(0xFF0B1F3A), fontWeight: FontWeight.bold)),
              style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: () async => _loadPackages(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              color: Colors.white,
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: const Padding(
                padding: EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Bienvenue 👋', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF0B1F3A))),
                    SizedBox(height: 6),
                    Text('Vos dossiers de candidature sur mesure (CV 1P & LM 1P) générés par l\'agent IA.',
                        style: TextStyle(color: Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            if (_packages.isEmpty)
              const Card(
                color: Colors.white,
                child: Padding(
                  padding: EdgeInsets.all(32.0),
                  child: Center(
                    child: Text('Aucune candidature générée pour le moment.'),
                  ),
                ),
              )
            else
              ..._packages.map((pkg) {
                final offer = pkg['job_offer'] ?? {};
                return Container(
                  margin: const EdgeInsets.only(bottom: 20.0),
                  child: Card(
                    color: Colors.white,
                    elevation: 2,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(color: const Color(0xFFE0F2FE), borderRadius: BorderRadius.circular(8)),
                                child: Text(offer['site_category'] ?? 'ACPE', style: const TextStyle(color: Color(0xFF0369A1), fontWeight: FontWeight.bold, fontSize: 11)),
                              ),
                              Text(pkg['processing_status'] ?? 'finalized', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.green)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(offer['title'] ?? 'Intitulé non spécifié', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0B1F3A))),
                          const SizedBox(height: 4),
                          Text(offer['company'] ?? 'Recruteur', style: const TextStyle(color: Color(0xFF64748B), fontSize: 14, fontWeight: FontWeight.w500)),
                          const SizedBox(height: 16),
                          const Divider(),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              IconButton.filledTonal(
                                onPressed: () => _openDetailModal(pkg, 'CV'),
                                icon: const Icon(Icons.description_outlined),
                                tooltip: 'Aperçu CV',
                                style: IconButton.styleFrom(backgroundColor: const Color(0xFFE0F2FE), foregroundColor: const Color(0xFF0369A1)),
                              ),
                              IconButton.filledTonal(
                                onPressed: () => _openDetailModal(pkg, 'LM'),
                                icon: const Icon(Icons.mark_email_read_outlined),
                                tooltip: 'Aperçu Lettre de Motivation',
                                style: IconButton.styleFrom(backgroundColor: const Color(0xFFE0F2FE), foregroundColor: const Color(0xFF0369A1)),
                              ),
                              IconButton.filledTonal(
                                onPressed: () => _openDetailModal(pkg, 'EMAIL'),
                                icon: const Icon(Icons.email_outlined),
                                tooltip: 'Aperçu Email',
                                style: IconButton.styleFrom(backgroundColor: const Color(0xFFF1F5F9), foregroundColor: const Color(0xFF185FA5)),
                              ),
                            ],
                          )
                        ],
                      ),
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}

class StructuredProfileTab extends StatefulWidget {
  const StructuredProfileTab({super.key});

  @override
  State<StructuredProfileTab> createState() => _StructuredProfileTabState();
}

class _StructuredProfileTabState extends State<StructuredProfileTab> {
  Map<String, dynamic> _info = {};
  Map<String, dynamic> _profile = {};
  List<dynamic> _experiences = [];
  List<dynamic> _certifications = [];
  List<dynamic> _educations = [];
  List<dynamic> _projects = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  void _loadAll() async {
    setState(() => _isLoading = true);
    final info = await ApiService.fetchProfileInfo();
    final prof = await ApiService.fetchProfile();
    final exps = await ApiService.fetchSection('experiences');
    final certs = await ApiService.fetchSection('certifications');
    final edus = await ApiService.fetchSection('educations');
    final projs = await ApiService.fetchSection('projects');

    setState(() {
      _info = info ?? {};
      _profile = prof ?? {};
      _experiences = exps;
      _certifications = certs;
      _educations = edus;
      _projects = projs;
      _isLoading = false;
    });
  }

  // Harmonized compact bottom sheet modal styled like CV Preview
  void _showHarmonizedModal({
    required String title,
    required Widget content,
    required VoidCallback onSave,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(ctx).size.height * 0.85,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 16,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0B1F3A))),
                IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close)),
              ],
            ),
            const Divider(),
            Flexible(
              child: SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8.0),
                  child: content,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: () {
                    onSave();
                    Navigator.pop(ctx);
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF185FA5), padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12)),
                  child: const Text('Enregistrer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                )
              ],
            )
          ],
        ),
      ),
    );
  }

  void _editInfoDialog() {
    final lastNameCtrl = TextEditingController(text: _info['last_name'] ?? '');
    final firstNameCtrl = TextEditingController(text: _info['first_name'] ?? '');
    String genderVal = _info['gender'] ?? 'MALE';
    final birthCtrl = TextEditingController(text: _info['birth_date'] ?? '1995-05-10');
    final phoneCtrl = TextEditingController(text: _info['primary_phone'] ?? '');
    final secPhoneCtrl = TextEditingController(text: _info['secondary_phone'] ?? '');
    final addressCtrl = TextEditingController(text: _info['address'] ?? '');
    final countryCtrl = TextEditingController(text: _info['country'] ?? 'Congo');
    final districtCtrl = TextEditingController(text: _info['district'] ?? '');
    final neighborhoodCtrl = TextEditingController(text: _info['neighborhood'] ?? '');
    final summaryCtrl = TextEditingController(text: _info['professional_summary'] ?? '');

    _showHarmonizedModal(
      title: 'Informations Générales',
      content: Column(
        children: [
          TextField(controller: lastNameCtrl, decoration: const InputDecoration(labelText: 'Nom *', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          TextField(controller: firstNameCtrl, decoration: const InputDecoration(labelText: 'Prénom *', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: genderVal,
            decoration: const InputDecoration(labelText: 'Genre *', border: OutlineInputBorder()),
            items: const [
              DropdownMenuItem(value: 'MALE', child: Text('Homme')),
              DropdownMenuItem(value: 'FEMALE', child: Text('Femme')),
              DropdownMenuItem(value: 'OTHER', child: Text('Autre')),
            ],
            onChanged: (v) { if (v != null) genderVal = v; },
          ),
          const SizedBox(height: 12),
          TextField(
            controller: birthCtrl,
            readOnly: true,
            decoration: const InputDecoration(
              labelText: 'Date de naissance *',
              border: OutlineInputBorder(),
              suffixIcon: Icon(Icons.calendar_today),
            ),
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: DateTime.tryParse(birthCtrl.text) ?? DateTime(1995, 5, 10),
                firstDate: DateTime(1950),
                lastDate: DateTime.now(),
              );
              if (picked != null) {
                birthCtrl.text = picked.toIso8601String().split('T')[0];
              }
            },
          ),
          const SizedBox(height: 12),
          TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Numéro principal *', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          TextField(controller: secPhoneCtrl, decoration: const InputDecoration(labelText: 'Numéro secondaire', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          TextField(controller: addressCtrl, decoration: const InputDecoration(labelText: 'Adresse', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          TextField(controller: countryCtrl, decoration: const InputDecoration(labelText: 'Pays', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          TextField(controller: districtCtrl, decoration: const InputDecoration(labelText: 'Arrondissement', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          TextField(controller: neighborhoodCtrl, decoration: const InputDecoration(labelText: 'Quartier', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          TextField(controller: summaryCtrl, decoration: const InputDecoration(labelText: 'Résumé professionnel', border: OutlineInputBorder()), maxLines: 3),
        ],
      ),
      onSave: () async {
        await ApiService.saveProfileInfo({
          'last_name': lastNameCtrl.text,
          'first_name': firstNameCtrl.text,
          'gender': genderVal,
          'birth_date': birthCtrl.text,
          'primary_phone': phoneCtrl.text,
          'secondary_phone': secPhoneCtrl.text,
          'address': addressCtrl.text,
          'country': countryCtrl.text,
          'district': districtCtrl.text,
          'neighborhood': neighborhoodCtrl.text,
          'professional_summary': summaryCtrl.text,
        });
        _loadAll();
      },
    );
  }

  void _addOrEditExpDialog([dynamic expItem]) {
    final titleCtrl = TextEditingController(text: expItem?['title'] ?? '');
    final companyCtrl = TextEditingController(text: expItem?['company'] ?? '');
    final industryCtrl = TextEditingController(text: expItem?['industry'] ?? 'Informatique');
    final locationCtrl = TextEditingController(text: expItem?['location'] ?? '');
    final startDateCtrl = TextEditingController(text: expItem?['start_date'] ?? '2024-01-01');
    final endDateCtrl = TextEditingController(text: expItem?['end_date'] ?? '');
    bool isCurrent = expItem?['is_current'] ?? false;
    final skillsCtrl = TextEditingController(text: expItem?['skills_acquired'] ?? '');

    _showHarmonizedModal(
      title: expItem != null ? 'Modifier Expérience' : 'Ajouter Expérience',
      content: StatefulBuilder(
        builder: (context, setModalState) => Column(
          children: [
            TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Poste occupé *', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: companyCtrl, decoration: const InputDecoration(labelText: 'Structure / Entreprise *', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: industryCtrl, decoration: const InputDecoration(labelText: 'Secteur d\'activité *', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: locationCtrl, decoration: const InputDecoration(labelText: 'Lieu', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(
              controller: startDateCtrl,
              readOnly: true,
              decoration: const InputDecoration(labelText: 'Date de début *', border: OutlineInputBorder(), suffixIcon: Icon(Icons.calendar_today)),
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: DateTime.tryParse(startDateCtrl.text) ?? DateTime(2024, 1, 1),
                  firstDate: DateTime(1980),
                  lastDate: DateTime.now(),
                );
                if (picked != null) {
                  setModalState(() => startDateCtrl.text = picked.toIso8601String().split('T')[0]);
                }
              },
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Checkbox(
                  value: isCurrent,
                  onChanged: (v) => setModalState(() => isCurrent = v ?? false),
                ),
                const Text('Poste occupé actuellement', style: TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            if (!isCurrent) ...[
              const SizedBox(height: 8),
              TextField(
                controller: endDateCtrl,
                readOnly: true,
                decoration: const InputDecoration(labelText: 'Date de fin', border: OutlineInputBorder(), suffixIcon: Icon(Icons.calendar_today)),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: DateTime.tryParse(endDateCtrl.text) ?? DateTime.now(),
                    firstDate: DateTime(1980),
                    lastDate: DateTime(2030),
                  );
                  if (picked != null) {
                    setModalState(() => endDateCtrl.text = picked.toIso8601String().split('T')[0]);
                  }
                },
              ),
            ],
            const SizedBox(height: 12),
            TextField(controller: skillsCtrl, decoration: const InputDecoration(labelText: 'Compétences acquises', border: OutlineInputBorder())),
          ],
        ),
      ),
      onSave: () async {
        final payload = {
          'title': titleCtrl.text,
          'company': companyCtrl.text,
          'industry': industryCtrl.text,
          'location': locationCtrl.text,
          'start_date': startDateCtrl.text,
          'end_date': isCurrent ? null : endDateCtrl.text,
          'is_current': isCurrent,
          'skills_acquired': skillsCtrl.text,
        };
        if (expItem != null) {
          await ApiService.updateSectionItem('experiences', expItem['id'], payload);
        } else {
          await ApiService.addSectionItem('experiences', payload);
        }
        _loadAll();
      },
    );
  }

  void _addOrEditCertDialog([dynamic certItem]) {
    final titleCtrl = TextEditingController(text: certItem?['title'] ?? '');
    final yearCtrl = TextEditingController(text: certItem?['year']?.toString() ?? '2025');
    final instCtrl = TextEditingController(text: certItem?['institution'] ?? '');

    _showHarmonizedModal(
      title: certItem != null ? 'Modifier Certificat' : 'Ajouter Certificat',
      content: Column(
        children: [
          TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Libellé du certificat *', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          TextField(
            controller: yearCtrl,
            readOnly: true,
            decoration: const InputDecoration(labelText: 'Année *', border: OutlineInputBorder(), suffixIcon: Icon(Icons.calendar_today)),
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: DateTime(int.tryParse(yearCtrl.text) ?? 2025),
                firstDate: DateTime(1980),
                lastDate: DateTime(2030),
                initialDatePickerMode: DatePickerMode.year,
              );
              if (picked != null) {
                yearCtrl.text = picked.year.toString();
              }
            },
          ),
          const SizedBox(height: 12),
          TextField(controller: instCtrl, decoration: const InputDecoration(labelText: 'Institution *', border: OutlineInputBorder())),
        ],
      ),
      onSave: () async {
        final payload = {
          'title': titleCtrl.text,
          'year': int.tryParse(yearCtrl.text) ?? 2025,
          'institution': instCtrl.text,
        };
        if (certItem != null) {
          await ApiService.updateSectionItem('certifications', certItem['id'], payload);
        } else {
          await ApiService.addSectionItem('certifications', payload);
        }
        _loadAll();
      },
    );
  }

  void _addOrEditEduDialog([dynamic eduItem]) {
    final titleCtrl = TextEditingController(text: eduItem?['title'] ?? '');
    final yearCtrl = TextEditingController(text: eduItem?['year']?.toString() ?? '2024');
    final instCtrl = TextEditingController(text: eduItem?['institution'] ?? '');
    final degreeCtrl = TextEditingController(text: eduItem?['degree_level'] ?? 'Licence');

    _showHarmonizedModal(
      title: eduItem != null ? 'Modifier Diplôme' : 'Ajouter Diplôme',
      content: Column(
        children: [
          TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Libellé du diplôme *', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          TextField(
            controller: yearCtrl,
            readOnly: true,
            decoration: const InputDecoration(labelText: 'Année *', border: OutlineInputBorder(), suffixIcon: Icon(Icons.calendar_today)),
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: DateTime(int.tryParse(yearCtrl.text) ?? 2024),
                firstDate: DateTime(1980),
                lastDate: DateTime(2030),
                initialDatePickerMode: DatePickerMode.year,
              );
              if (picked != null) {
                yearCtrl.text = picked.year.toString();
              }
            },
          ),
          const SizedBox(height: 12),
          TextField(controller: instCtrl, decoration: const InputDecoration(labelText: 'Institution *', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          TextField(controller: degreeCtrl, decoration: const InputDecoration(labelText: 'Niveau d\'étude *', border: OutlineInputBorder())),
        ],
      ),
      onSave: () async {
        final payload = {
          'title': titleCtrl.text,
          'year': int.tryParse(yearCtrl.text) ?? 2024,
          'institution': instCtrl.text,
          'degree_level': degreeCtrl.text,
        };
        if (eduItem != null) {
          await ApiService.updateSectionItem('educations', eduItem['id'], payload);
        } else {
          await ApiService.addSectionItem('educations', payload);
        }
        _loadAll();
      },
    );
  }

  void _addOrEditProjDialog([dynamic projItem]) {
    final nameCtrl = TextEditingController(text: projItem?['name'] ?? '');
    final industryCtrl = TextEditingController(text: projItem?['industry'] ?? 'Informatique');

    _showHarmonizedModal(
      title: projItem != null ? 'Modifier Projet' : 'Ajouter Projet',
      content: Column(
        children: [
          TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Nom du projet *', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          TextField(controller: industryCtrl, decoration: const InputDecoration(labelText: 'Secteur d\'activité *', border: OutlineInputBorder())),
        ],
      ),
      onSave: () async {
        final payload = {
          'name': nameCtrl.text,
          'industry': industryCtrl.text,
        };
        if (projItem != null) {
          await ApiService.updateSectionItem('projects', projItem['id'], payload);
        } else {
          await ApiService.addSectionItem('projects', payload);
        }
        _loadAll();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final String? photoUrl = _profile['cropped_photo'];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            color: Colors.white,
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      CircleAvatar(
                        radius: 36,
                        backgroundColor: const Color(0xFF185FA5),
                        backgroundImage: photoUrl != null && photoUrl.isNotEmpty ? NetworkImage(photoUrl) : null,
                        child: photoUrl == null || photoUrl.isEmpty ? const Icon(Icons.person, color: Colors.white, size: 40) : null,
                      ),

                      // Fully Operational Contextual Menu Popup for Photo Actions
                      PopupMenuButton<String>(
                        icon: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(color: const Color(0xFF185FA5), borderRadius: BorderRadius.circular(8)),
                          child: const Row(
                            children: [
                              Icon(Icons.camera_alt, color: Colors.white, size: 16),
                              SizedBox(width: 6),
                              Text('Photo', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                            ],
                          ),
                        ),
                        onSelected: (val) async {
                          final messenger = ScaffoldMessenger.of(context);
                          if (val == 'Supprimer') {
                            final ok = await ApiService.deleteProfilePhoto();
                            if (ok) {
                              _loadAll();
                              messenger.showSnackBar(const SnackBar(content: Text('Photo de profil supprimée.')));
                            }
                          } else if (val == 'Caméra' || val == 'Galerie') {
                            final ok = await ApiService.uploadProfilePhoto(val);
                            if (ok) {
                              _loadAll();
                              messenger.showSnackBar(SnackBar(content: Text('Photo mise à jour via $val.')));
                            } else {
                              messenger.showSnackBar(SnackBar(content: Text('Action $val en cours de traitement.')));
                            }
                          }
                        },
                        itemBuilder: (ctx) => [
                          const PopupMenuItem(value: 'Caméra', child: Row(children: [Icon(Icons.camera_alt), SizedBox(width: 8), Text('Caméra')])),
                          const PopupMenuItem(value: 'Galerie', child: Row(children: [Icon(Icons.photo_library), SizedBox(width: 8), Text('Galerie')])),
                          const PopupMenuItem(value: 'Supprimer', child: Row(children: [Icon(Icons.delete, color: Colors.red), SizedBox(width: 8), Text('Supprimer', style: TextStyle(color: Colors.red))])),
                        ],
                      )
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('${_info['first_name'] ?? 'Christ'} ${_info['last_name'] ?? 'Obiey'}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF0B1F3A))),
                      IconButton(onPressed: _editInfoDialog, icon: const Icon(Icons.edit, color: Color(0xFF185FA5))),
                    ],
                  ),

                  if (_info['primary_phone'] != null && _info['primary_phone'].toString().isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4.0),
                      child: Text('Tél: ${_info['primary_phone']}', style: const TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w600)),
                    ),
                  if (_info['address'] != null && _info['address'].toString().isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4.0),
                      child: Text('Adresse: ${_info['address']}', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                    ),
                  if (_info['country'] != null && _info['country'].toString().isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4.0),
                      child: Text('Pays: ${_info['country']}', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                    ),
                  if (_info['district'] != null && _info['district'].toString().isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4.0),
                      child: Text('Arrondissement: ${_info['district']}', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                    ),
                  if (_info['neighborhood'] != null && _info['neighborhood'].toString().isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4.0),
                      child: Text('Quartier: ${_info['neighborhood']}', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                    ),
                  if (_info['professional_summary'] != null && _info['professional_summary'].toString().isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0),
                      child: Text('Summary: ${_info['professional_summary']}', style: const TextStyle(color: Color(0xFF444441), fontSize: 13, fontStyle: FontStyle.italic)),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          _buildSectionHeader('Expériences Professionnelles', () => _addOrEditExpDialog()),
          ..._experiences.map((exp) => Card(
            margin: const EdgeInsets.only(bottom: 10),
            color: Colors.white,
            elevation: 1,
            child: ListTile(
              title: Text(exp['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0B1F3A))),
              subtitle: Text('${exp['company'] ?? ''} | Début: ${exp['start_date'] ?? ''} | Fin: ${exp['is_current'] == true ? 'Poste Actuel' : (exp['end_date'] ?? 'N/A')}'),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(icon: const Icon(Icons.edit, color: Color(0xFF185FA5)), onPressed: () => _addOrEditExpDialog(exp)),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                    onPressed: () async {
                      await ApiService.deleteSectionItem('experiences', exp['id']);
                      _loadAll();
                    },
                  ),
                ],
              ),
            ),
          )),

          _buildSectionHeader('Certifications et Attestations', () => _addOrEditCertDialog()),
          ..._certifications.map((cert) => Card(
            margin: const EdgeInsets.only(bottom: 10),
            color: Colors.white,
            elevation: 1,
            child: ListTile(
              title: Text('${cert['title']} (${cert['year']})', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0B1F3A))),
              subtitle: Text(cert['institution'] ?? ''),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(icon: const Icon(Icons.edit, color: Color(0xFF185FA5)), onPressed: () => _addOrEditCertDialog(cert)),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                    onPressed: () async {
                      await ApiService.deleteSectionItem('certifications', cert['id']);
                      _loadAll();
                    },
                  ),
                ],
              ),
            ),
          )),

          _buildSectionHeader('Diplômes', () => _addOrEditEduDialog()),
          ..._educations.map((edu) => Card(
            margin: const EdgeInsets.only(bottom: 10),
            color: Colors.white,
            elevation: 1,
            child: ListTile(
              title: Text('${edu['title']} - ${edu['degree_level']} (${edu['year']})', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0B1F3A))),
              subtitle: Text(edu['institution'] ?? ''),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(icon: const Icon(Icons.edit, color: Color(0xFF185FA5)), onPressed: () => _addOrEditEduDialog(edu)),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                    onPressed: () async {
                      await ApiService.deleteSectionItem('educations', edu['id']);
                      _loadAll();
                    },
                  ),
                ],
              ),
            ),
          )),

          _buildSectionHeader('Projets', () => _addOrEditProjDialog()),
          ..._projects.map((proj) => Card(
            margin: const EdgeInsets.only(bottom: 10),
            color: Colors.white,
            elevation: 1,
            child: ListTile(
              title: Text(proj['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0B1F3A))),
              subtitle: Text(proj['industry'] ?? ''),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(icon: const Icon(Icons.edit, color: Color(0xFF185FA5)), onPressed: () => _addOrEditProjDialog(proj)),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                    onPressed: () async {
                      await ApiService.deleteSectionItem('projects', proj['id']);
                      _loadAll();
                    },
                  ),
                ],
              ),
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, VoidCallback onAdd) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0B1F3A))),
          IconButton(onPressed: onAdd, icon: const Icon(Icons.add_circle, color: Color(0xFF185FA5), size: 28)),
        ],
      ),
    );
  }
}

class CreateApplicationTab extends StatefulWidget {
  final VoidCallback onGenerated;
  const CreateApplicationTab({super.key, required this.onGenerated});

  @override
  State<CreateApplicationTab> createState() => _CreateApplicationTabState();
}

class _CreateApplicationTabState extends State<CreateApplicationTab> {
  final _urlController = TextEditingController();
  final _textController = TextEditingController();
  String? _selectedFileName;
  bool _isGenerating = false;

  void _generate() async {
    if (_urlController.text.isEmpty && _textController.text.isEmpty && _selectedFileName == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez spécifier l\'URL, le texte ou sélectionner un document (PDF / Image).')),
      );
      return;
    }

    setState(() => _isGenerating = true);
    final success = await ApiService.generateApplication(_textController.text, _urlController.text, fileName: _selectedFileName);
    setState(() => _isGenerating = false);

    if (success) {
      _urlController.clear();
      _textController.clear();
      setState(() => _selectedFileName = null);
      widget.onGenerated();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Candidature sur mesure générée avec succès !')),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Erreur lors de la génération. Vérifiez vos crédits.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Card(
        color: Colors.white,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Générer un Dossier Sur Mesure',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0B1F3A))),
              const SizedBox(height: 16),
              TextField(
                controller: _urlController,
                decoration: const InputDecoration(
                  labelText: 'Lien URL de l\'offre d\'emploi',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.link),
                ),
              ),
              const SizedBox(height: 12),
              const Center(child: Text('OU', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey))),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid),
                  borderRadius: BorderRadius.circular(12),
                  color: const Color(0xFFF8FAFC),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.upload_file, color: Color(0xFF185FA5), size: 32),
                    const SizedBox(height: 8),
                    Text(
                      _selectedFileName != null ? 'Fichier: $_selectedFileName' : 'Téléverser Offre PDF / Image (Capture)',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0B1F3A)),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton.icon(
                      onPressed: () {
                        setState(() {
                          _selectedFileName = 'offre_d_emploi_capture.pdf';
                        });
                      },
                      icon: const Icon(Icons.attach_file, size: 16),
                      label: const Text('Choisir un document (PDF / Image)'),
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0B1F3A)),
                    )
                  ],
                ),
              ),
              const SizedBox(height: 12),
              const Center(child: Text('OU', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey))),
              const SizedBox(height: 12),
              TextField(
                controller: _textController,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Texte brut de l\'offre',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: _isGenerating ? null : _generate,
                icon: _isGenerating ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.auto_awesome),
                label: Text(_isGenerating ? 'Génération par AGENT_IA_CV...' : 'Lancer la Génération IA'),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF185FA5), padding: const EdgeInsets.symmetric(vertical: 16)),
              )
            ],
          ),
        ),
      ),
    );
  }
}

class PaymentsTab extends StatefulWidget {
  final VoidCallback onPaid;
  const PaymentsTab({super.key, required this.onPaid});

  @override
  State<PaymentsTab> createState() => _PaymentsTabState();
}

class _PaymentsTabState extends State<PaymentsTab> {
  final _phoneController = TextEditingController(text: '+242066130118');
  List<dynamic> _plans = [];
  int? _selectedPlanId;
  String _selectedMethod = 'AIRTEL_MONEY';
  bool _isPaying = false;
  bool _isLoadingPlans = true;

  @override
  void initState() {
    super.initState();
    _loadPlans();
  }

  void _loadPlans() async {
    setState(() => _isLoadingPlans = true);
    final plansList = await ApiService.fetchPlans();
    setState(() {
      _plans = plansList;
      if (_plans.isNotEmpty) {
        _selectedPlanId = _plans[0]['id'];
      }
      _isLoadingPlans = false;
    });
  }

  void _pay() async {
    if (_selectedPlanId == null && _plans.isNotEmpty) {
      _selectedPlanId = _plans[0]['id'];
    }

    setState(() => _isPaying = true);
    final success = await ApiService.payMobileMoney(_selectedPlanId ?? 1, _selectedMethod, _phoneController.text);
    setState(() => _isPaying = false);

    if (success) {
      widget.onPaid();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Paiement réussi via $_selectedMethod ! Crédits rechargés.')),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Échec de la transaction.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingPlans) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_plans.isNotEmpty) ...[
            const Text('Formules d\'Abonnement', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0B1F3A))),
            const SizedBox(height: 10),
            ..._plans.map((p) => Card(
              color: _selectedPlanId == p['id'] ? const Color(0xFFE0F2FE) : Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(
                  color: _selectedPlanId == p['id'] ? const Color(0xFF185FA5) : Colors.grey.shade300,
                  width: _selectedPlanId == p['id'] ? 2 : 1,
                ),
              ),
              child: ListTile(
                title: Text(p['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('${p['description'] ?? ''} (${p['applications_limit']} candidatures)'),
                trailing: Text('${p['price_fcfa']} FCFA', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF185FA5), fontSize: 16)),
                onTap: () => setState(() => _selectedPlanId = p['id']),
              ),
            )),
            const SizedBox(height: 16),
          ],
          Card(
            color: Colors.white,
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Règlement Mobile Money', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0B1F3A))),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedMethod,
                    decoration: const InputDecoration(labelText: 'Mode de paiement', border: OutlineInputBorder()),
                    items: const [
                      DropdownMenuItem(value: 'AIRTEL_MONEY', child: Text('Airtel Money Congo')),
                      DropdownMenuItem(value: 'MTN_MOMO', child: Text('MTN Mobile Money Congo')),
                      DropdownMenuItem(value: 'PAYDUNYA', child: Text('Carte Bancaire (PayDunya)')),
                    ],
                    onChanged: (v) { if (v != null) setState(() => _selectedMethod = v); },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _phoneController,
                    decoration: const InputDecoration(
                      labelText: 'Numéro Mobile Money (+242)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isPaying ? null : _pay,
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F6E56), padding: const EdgeInsets.symmetric(vertical: 16)),
                      child: Text(_isPaying ? 'Traitement...' : 'Payer et recharger', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16)),
                    ),
                  )
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
