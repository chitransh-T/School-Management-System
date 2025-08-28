import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:sms/pages/auth/login.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';
import 'package:intl/intl.dart';

class SendTextPage extends StatefulWidget {
  const SendTextPage({super.key});

  @override
  State<SendTextPage> createState() => _SendTextPageState();
}

class _SendTextPageState extends State<SendTextPage> {
  final TextEditingController _controller = TextEditingController();
  bool _isLoading = false;
  String? _token, _teacherName;
  int? _studentId;
  String? _errorMessage;
  List<dynamic> _sentMessages = [];

  final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  @override
  void initState() {
    super.initState();
    _initData();
  }

  Future<void> _initData() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) {
      if (!mounted) return;
      Navigator.pushReplacement(
          context, MaterialPageRoute(builder: (_) => const LoginPage()));
      return;
    }
    _token = token;
    await _fetchTeacherAndStudent();
    await _fetchSentMessages();
  }

  String _formatDate(String timestamp) {
    try {
      final dateTime = DateTime.parse(timestamp).toLocal();
      return DateFormat('MMM dd, yyyy - hh:mm a').format(dateTime);
    } catch (e) {
      return timestamp;
    }
  }

  Future<void> _fetchTeacherAndStudent() async {
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/api/dashboard/students'), headers: {
        'Authorization': 'Bearer $_token',
        'Accept': 'application/json',
      });
      final data = json.decode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        final info = data['data'][0];
        setState(() {
          _teacherName = info['teacher_name'];
          _studentId = info['student_id'];
        });
      } else {
        setState(() {
          _errorMessage = data['message'] ?? 'Failed to load teacher info';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: ${e.toString()}';
      });
    }
  }

  Future<void> _fetchSentMessages() async {
    if (_token == null) return;
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/api/parent-get-messages'), headers: {
        'Authorization': 'Bearer $_token',
        'Accept': 'application/json',
      });
      final data = json.decode(res.body);
      if (res.statusCode == 200) {
        setState(() {
          _sentMessages = data;
        });
      } else {
        setState(() {
          _errorMessage = data['error'] ?? 'Failed to fetch messages';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: ${e.toString()}';
      });
    }
  }

  Future<void> _handleSend() async {
    if (_token == null) {
      setState(() => _errorMessage = "Not authenticated");
      return;
    }
    if (_studentId == null) {
      setState(() => _errorMessage = "No student ID");
      return;
    }
    if (_controller.text.trim().isEmpty) {
      setState(() => _errorMessage = "Message cannot be empty");
      return;
    }

    setState(() => _isLoading = true);
    final msg = _controller.text.trim();
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/api/parent-send-message'),
        headers: {
          'Authorization': 'Bearer $_token',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: json.encode({'student_id': _studentId, 'message': msg}),
      );
      final data = json.decode(res.body);
      if (res.statusCode == 200) {
        _controller.clear();
        await _fetchSentMessages();
        if (!mounted) return;
        showCustomSnackBar(context, 'Message sent successfully',
            backgroundColor: Colors.green);
      } else {
        setState(() {
          _errorMessage = data['error'] ?? 'Failed to send message';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: ${e.toString()}';
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleDelete(int id) async {
    if (_token == null) return;
    try {
      final res = await http.delete(
          Uri.parse('$baseUrl/api/parent-delete-message/$id'),
          headers: {
            'Authorization': 'Bearer $_token',
            'Accept': 'application/json',
          });
      final data = json.decode(res.body);
      if (res.statusCode == 200) {
        setState(() {
          _sentMessages.removeWhere((msg) => msg['id'] == id);
        });
        if (!mounted) return;
        showCustomSnackBar(context, 'Message deleted',
            backgroundColor: Colors.red);
      } else {
        setState(() {
          _errorMessage = data['error'] ?? 'Failed to delete message';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: ${e.toString()}';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(
        title: 'Send Message',
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_errorMessage != null)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: Colors.red.shade100,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red.shade300),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: Colors.red),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: TextStyle(color: Colors.red.shade800),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, size: 18),
                            onPressed: () =>
                                setState(() => _errorMessage = null),
                          ),
                        ],
                      ),
                    ),
                  // Message Card
                  Card(
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'To: ${_teacherName ?? 'Loading...'}',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey.shade700,
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextField(
                            controller: _controller,
                            maxLength: 200,
                            maxLines: 4,
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: Colors.grey.shade50,
                              hintText: 'Type your message here...',
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide.none,
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(
                                  color: Theme.of(context).primaryColor,
                                ),
                              ),
                              contentPadding: const EdgeInsets.all(12),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Align(
                            alignment: Alignment.centerRight,
                            child: CustomButton(
                              text: 'Send',
                              onPressed: _handleSend,
                              isLoading: _isLoading,
                              width: 120,
                              height: 45,
                              icon: Icons.send,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Text(
                        'Message History',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(width: 8),
                      if (_sentMessages.isNotEmpty)
                        Chip(
                          label: Text('${_sentMessages.length}'),
                          backgroundColor:
                              Theme.of(context).primaryColor.withAlpha(25),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  _sentMessages.isEmpty
                      ? Padding(
                          padding: const EdgeInsets.only(top: 40),
                          child: Center(
                            child: Column(
                              children: [
                                Icon(Icons.inbox_outlined,
                                    size: 64, color: Colors.grey.shade400),
                                const SizedBox(height: 16),
                                Text(
                                  'No messages sent yet',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                      : ListView.builder(
                          itemCount: _sentMessages.length,
                          physics: const NeverScrollableScrollPhysics(),
                          shrinkWrap: true,
                          itemBuilder: (_, i) {
                            final msg = _sentMessages[i];
                            return Card(
                              margin: const EdgeInsets.symmetric(vertical: 6),
                              elevation: 1,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: ListTile(
                                contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 8),
                                title: Text(
                                  msg['message'],
                                  style: const TextStyle(fontSize: 15),
                                ),
                                subtitle: Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Text(
                                    _formatDate(msg['created_at']),
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                ),
                                trailing: IconButton(
                                  icon: Icon(
                                    Icons.delete_outline,
                                    color: Colors.grey.shade500,
                                  ),
                                  onPressed: () => _handleDelete(msg['id']),
                                ),
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
}
