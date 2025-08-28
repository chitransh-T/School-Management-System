import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:sms/pages/auth/login.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';
import 'package:sms/widgets/utils/date_utils.dart';

class ViewSentMessagesPage extends StatefulWidget {
  const ViewSentMessagesPage({super.key});

  @override
  State<ViewSentMessagesPage> createState() => _ViewSentMessagesPageState();
}

class _ViewSentMessagesPageState extends State<ViewSentMessagesPage> {
  List<dynamic> _messages = [];
  bool _isLoading = true;
  String? _errorMessage;
  String? _token;
  final String _baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  @override
  void initState() {
    super.initState();
    _loadTokenAndFetchMessages();
  }

  Future<void> _loadTokenAndFetchMessages() async {
    final prefs = await SharedPreferences.getInstance();
    final tkn = prefs.getString('token');
    if (tkn == null) {
      if (!mounted) return;
      Navigator.pushReplacement(
          context, MaterialPageRoute(builder: (_) => const LoginPage()));
      return;
    }

    setState(() => _token = tkn);
    await _fetchMessages();
  }

  Future<void> _fetchMessages() async {
    setState(() => _isLoading = true);
    try {
      final res = await http.get(
        Uri.parse('$_baseUrl/api/sent-messages'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $_token',
        },
      );

      if (res.statusCode == 200) {
        setState(() {
          _messages = json.decode(res.body);
        });
      } else {
        setState(() => _errorMessage = 'Failed to fetch sent messages');
      }
    } catch (e) {
      setState(() => _errorMessage = 'Error: ${e.toString()}');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteMessage(int id) async {
    if (_token == null) return;

    setState(() => _isLoading = true);
    try {
      final res = await http.delete(
        Uri.parse('$_baseUrl/api/sent-messages/$id'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $_token',
        },
      );

      if (res.statusCode == 200) {
        setState(() {
          _messages.removeWhere((msg) => msg['id'] == id);
        });

        if (!mounted) return;
        showCustomSnackBar(context, 'Message deleted successfully',
            backgroundColor: Colors.green);
      } else {
        final data = json.decode(res.body);
        setState(() => _errorMessage = data['error'] ?? 'Delete failed');
      }
    } catch (e) {
      setState(() => _errorMessage = 'Error deleting message: ${e.toString()}');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: 'View Send Messages'),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  if (_errorMessage != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.red.shade400,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error, color: Colors.white),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: const TextStyle(color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ),
                  Expanded(
                    child: _messages.isEmpty
                        ? const Center(
                            child: Text(
                              'No messages sent yet.',
                              style: TextStyle(fontSize: 16),
                            ),
                          )
                        : ListView.builder(
                            itemCount: _messages.length,
                            itemBuilder: (_, i) {
                              final msg = _messages[i];
                              return Card(
                                elevation: 4,
                                margin: const EdgeInsets.symmetric(vertical: 8),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                color: Colors.deepPurple.shade50,
                                child: ListTile(
                                  contentPadding: const EdgeInsets.all(16),
                                  title: Text(
                                    msg['message'],
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  subtitle: Padding(
                                    padding: const EdgeInsets.only(top: 8),
                                    child: Text(
                                      'To parents of ${msg['student_name'] ?? "Unknown Student"}\n${formatTimestamp(msg['created_at'])}',
                                      style: const TextStyle(
                                        color: Colors.black54,
                                        height: 1.4,
                                      ),
                                    ),
                                  ),
                                  trailing: IconButton(
                                    icon: const Icon(Icons.delete,
                                        color: Colors.red),
                                    onPressed: () => _deleteMessage(msg['id']),
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
      ),
    );
  }
}
