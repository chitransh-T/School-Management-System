import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:sms/pages/auth/login.dart';
import 'package:sms/pages/teacher_dashboard/sent_text.dart';
import 'package:sms/widgets/custom_appbar.dart';

class Student {
  final String id, name, assignedClass, assignedSection;
  Student(
      {required this.id,
      required this.name,
      required this.assignedClass,
      required this.assignedSection});
}

class SendMessagePage extends StatefulWidget {
  const SendMessagePage({super.key});
  @override
  State<SendMessagePage> createState() => _SendMessagePageState();
}

class _SendMessagePageState extends State<SendMessagePage> {
  List<Student> _students = [];
  String _search = '';
  String? _token, _selectedClass, _selectedSection, _error;
  bool _initialLoading = true;
  final baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final prefs = await SharedPreferences.getInstance();
    final tkn = prefs.getString('token');
    if (tkn == null) {
      if (!mounted) return;
      Navigator.pushReplacement(
          context, MaterialPageRoute(builder: (_) => const LoginPage()));
      return;
    }
    setState(() => _token = tkn);
    await _loadAssignedClass();
    setState(() => _initialLoading = false);
  }

  Future<void> _loadAssignedClass() async {
    try {
      final res =
          await http.get(Uri.parse('$baseUrl/api/assigned-class'), headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer $_token',
      });
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        setState(() {
          _selectedClass = data['class_name'];
          _selectedSection = data['section'];
        });
        await _fetchStudents();
      } else if (res.statusCode == 401) {
        _logout();
      } else {
        setState(() => _error = dataMessage(res));
      }
    } catch (e) {
      setState(() => _error = 'Error: ${e.toString()}');
    } finally {}
  }

  Future<void> _fetchStudents() async {
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/api/getstudents/teacher-class'), headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer $_token',
      });
      final data = json.decode(res.body);
      final arr = data['students'] ?? data['data'] ?? [];
      setState(() {
        _students = List.from(arr)
            .map((item) => Student(
                  id: item['student_id']?.toString() ?? item['id'].toString(),
                  name: item['student_name'] ?? 'Unknown',
                  assignedClass: item['assigned_class'] ?? _selectedClass ?? '',
                  assignedSection:
                      item['assigned_section'] ?? _selectedSection ?? '',
                ))
            .toList();
      });
    } catch (e) {
      setState(() => _error = 'Error: ${e.toString()}');
    }
  }

  void _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    if (!mounted) return;
    Navigator.pushReplacement(
        context, MaterialPageRoute(builder: (_) => const LoginPage()));
  }

  void _onStudentTap(Student s) {
    Navigator.push(
      context,
      MaterialPageRoute(
          builder: (_) => SendTextPage(
                studentId: s.id,
                studentName: s.name,
              )),
    );
  }

  String dataMessage(http.Response res) {
    try {
      final body = json.decode(res.body);
      return body['message'] ?? 'Something went wrong';
    } catch (_) {
      return 'Server error';
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _students
        .where((s) => s.name.toLowerCase().contains(_search.toLowerCase()))
        .toList();
    final theme = Theme.of(context);

    return Scaffold(
      appBar: CustomAppBar(
        title: 'Send Messages',
      ),
      body: _initialLoading
          ? const Center(child: CircularProgressIndicator())
          : LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: ConstrainedBox(
                    constraints:
                        BoxConstraints(minHeight: constraints.maxHeight),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_error != null)
                          Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: theme.colorScheme.errorContainer,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            padding: const EdgeInsets.all(12),
                            margin: const EdgeInsets.only(bottom: 16),
                            child: Text(
                              _error!,
                              style: TextStyle(
                                  color: theme.colorScheme.onErrorContainer),
                            ),
                          ),
                        Card(
                          elevation: 2,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              children: [
                                _buildClassInfoItem(
                                  icon: Icons.school,
                                  label: 'Class',
                                  value: _selectedClass ?? "-",
                                  theme: theme,
                                ),
                                Container(
                                  height: 40,
                                  width: 1,
                                  color: theme.dividerColor,
                                ),
                                _buildClassInfoItem(
                                  icon: Icons.group,
                                  label: 'Section',
                                  value: _selectedSection ?? "-",
                                  theme: theme,
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          'Search Students',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          decoration: InputDecoration(
                            labelText: 'Search by name',
                            prefixIcon: const Icon(Icons.search),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          onChanged: (v) => setState(() => _search = v),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          'Students List',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        filtered.isEmpty
                            ? Padding(
                                padding: const EdgeInsets.only(top: 60),
                                child: Center(
                                  child: Column(
                                    children: [
                                      Icon(
                                        Icons.people_outline,
                                        size: 60,
                                        color: theme.disabledColor,
                                      ),
                                      const SizedBox(height: 16),
                                      Text(
                                        'No students found',
                                        style:
                                            theme.textTheme.bodyLarge?.copyWith(
                                          color: theme.disabledColor,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              )
                            : ListView.separated(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: filtered.length,
                                separatorBuilder: (_, i) =>
                                    const Divider(height: 1),
                                itemBuilder: (_, i) {
                                  final s = filtered[i];
                                  return Card(
                                    elevation: 1,
                                    margin: EdgeInsets.zero,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: ListTile(
                                      contentPadding:
                                          const EdgeInsets.symmetric(
                                              horizontal: 16, vertical: 8),
                                      leading: CircleAvatar(
                                        backgroundColor:
                                            theme.primaryColor.withAlpha(51),
                                        child: Text(
                                          s.name[0].toUpperCase(),
                                          style: TextStyle(
                                            color: theme.primaryColor,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                      title: Text(
                                        s.name,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      subtitle: Text(
                                        '${s.assignedClass} - ${s.assignedSection}',
                                        style: theme.textTheme.bodySmall,
                                      ),
                                      trailing: Icon(
                                        Icons.arrow_forward_ios,
                                        size: 16,
                                        color: theme.disabledColor,
                                      ),
                                      onTap: () => _onStudentTap(s),
                                    ),
                                  );
                                },
                              ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  Widget _buildClassInfoItem({
    required IconData icon,
    required String label,
    required String value,
    required ThemeData theme,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 24, color: theme.primaryColor),
        const SizedBox(height: 4),
        Text(
          label,
          style: theme.textTheme.bodySmall,
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
