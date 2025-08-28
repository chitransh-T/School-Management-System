import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/pages/profile_setting/profile_setup.dart';
import 'package:sms/pages/auth/login.dart';
import 'package:sms/pages/services/profile_service.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/sidebar.dart';
import 'package:sms/widgets/notice_widget.dart';
import 'package:sms/pages/principle/change_password.dart';

class PrincipleDashboard extends StatefulWidget {
  const PrincipleDashboard({super.key});

  @override
  State<PrincipleDashboard> createState() => _PrincipleDashboardState();
}

class _PrincipleDashboardState extends State<PrincipleDashboard> {
  int totalStudents = 0, totalTeachers = 0, totalClasses = 0;
  bool loadingCounts = true, loadingProfile = true;
  static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  String? instituteName, instituteAddress, logoUrlFull;

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    await Future.wait([_fetchProfileData(), _fetchCounts()]);
  }

  Future<void> _fetchProfileData() async {
    setState(() => loadingProfile = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) throw Exception('No token');

      final profile = await ProfileService.getProfile();
      final data = profile['data'];
      if (data != null) {
        final name = data['institute_name']?.toString() ?? '';
        final addr = data['address']?.toString() ?? '';
        final logo = data['logo_url']?.toString() ?? '';

        String? fullUrl;
        if (logo.isNotEmpty) {
          final cleanedBase = baseUrl.replaceAll(RegExp(r'\/+$'), '');
          final cleanedLogo = logo.startsWith('/') ? logo : '/$logo';
          fullUrl = logo.startsWith('http') ? logo : cleanedBase + cleanedLogo;
        }

        setState(() {
          instituteName = name;
          instituteAddress = addr;
          logoUrlFull = fullUrl;
        });
      }
    } catch (e) {
      debugPrint('Profile fetch error: $e');
    } finally {
      setState(() => loadingProfile = false);
    }
  }

  Future<void> _fetchCounts() async {
    setState(() => loadingCounts = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) throw Exception('No token');

      final headers = {'Authorization': 'Bearer $token'};
      final sResp = await http.get(Uri.parse('$baseUrl/api/api/students/count'),
          headers: headers);
      final tResp = await http.get(Uri.parse('$baseUrl/api/api/teachers/count'),
          headers: headers);
      final cResp =
          await http.get(Uri.parse('$baseUrl/api/count'), headers: headers);

      if (sResp.statusCode == 200 &&
          tResp.statusCode == 200 &&
          cResp.statusCode == 200) {
        setState(() {
          totalStudents = int.tryParse(
                  json.decode(sResp.body)['totalStudents'].toString()) ??
              0;
          totalTeachers = int.tryParse(
                  json.decode(tResp.body)['totalTeachers'].toString()) ??
              0;
          totalClasses = int.tryParse(
                  json.decode(cResp.body)['totalClasses'].toString()) ??
              0;
        });
      } else {
        throw Exception('Count fetch failed');
      }
    } catch (e) {
      debugPrint('Count fetch error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load counts')),
        );
      }
    } finally {
      setState(() => loadingCounts = false);
    }
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Confirm Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('No')),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Yes')),
        ],
      ),
    );
    if (confirm == true) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
      if (mounted) {
        Navigator.pushReplacement(
            context, MaterialPageRoute(builder: (_) => const LoginPage()));
      }
    }
  }

  Widget _buildLogo(double size) {
    if (logoUrlFull?.isNotEmpty == true) {
      return CircleAvatar(
        radius: size / 2,
        backgroundColor: Colors.grey.shade300,
        backgroundImage: NetworkImage(logoUrlFull!),
      );
    }
    return CircleAvatar(
      radius: size / 2,
      backgroundImage: const AssetImage('assets/images/almanet1.jpg'),
    );
  }

  Widget _buildDashboardCard(
      String title, int value, IconData icon, Color color) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 40, color: color),
          const SizedBox(height: 10),
          Text(title, style: const TextStyle(fontSize: 16)),
          const SizedBox(height: 5),
          Text(value.toString(),
              style:
                  const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(
        title: '',
        actions: [
          PopupMenuButton<String>(
            icon: Row(children: [
              _buildLogo(40),
              const Icon(Icons.arrow_drop_down, color: Colors.white)
            ]),
            onSelected: (v) async {
              if (v == 'profile') {
                await Navigator.push(context,
                    MaterialPageRoute(builder: (_) => ProfileSetupPage()));
                _fetchProfileData();
              } else if (v == 'settings') {
                await Navigator.push(context,
                    MaterialPageRoute(builder: (_) => ChangePasswordPage()));
              } else if (v == 'logout') {
                _logout();
              }
            },
            itemBuilder: (_) => [
              const PopupMenuItem(
                  value: 'profile',
                  child: ListTile(
                      leading: Icon(Icons.person), title: Text('Set Profile'))),
              const PopupMenuItem(
                  value: 'settings',
                  child: ListTile(
                      leading: Icon(Icons.settings), title: Text('Settings'))),
              const PopupMenuItem(
                  value: 'logout',
                  child: ListTile(
                      leading: Icon(Icons.logout), title: Text('Logout'))),
            ],
          ),
        ],
      ),
      drawer: Sidebar(
        userType: 'principal',
        profileImageUrl: logoUrlFull,
        instituteName: instituteName,
        instituteAddress: instituteAddress,
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _initializeData,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text("Welcome to ${instituteName ?? 'Dashboard'}",
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              loadingCounts
                  ? const Center(child: CircularProgressIndicator())
                  : Row(
                      children: [
                        Expanded(
                            child: _buildDashboardCard("Students",
                                totalStudents, Icons.group, Colors.blue)),
                        const SizedBox(width: 10),
                        Expanded(
                            child: _buildDashboardCard("Teachers",
                                totalTeachers, Icons.person, Colors.green)),
                        const SizedBox(width: 10),
                        Expanded(
                            child: _buildDashboardCard("Classes", totalClasses,
                                Icons.class_, Colors.orange)),
                      ],
                    ),
              const SizedBox(height: 30),
              const NoticeWidget(),
            ]),
          ),
        ),
      ),
    );
  }
}
