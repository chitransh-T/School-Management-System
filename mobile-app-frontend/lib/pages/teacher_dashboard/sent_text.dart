import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:sms/pages/teacher_dashboard/t_dashboard.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart'; // snackbar file import karo

class SendTextPage extends StatefulWidget {
  final String studentId;
  final String? studentName;

  const SendTextPage({
    super.key,
    required this.studentId,
    this.studentName,
  });

  @override
  State<SendTextPage> createState() => _SendTextPageState();
}

class _SendTextPageState extends State<SendTextPage> {
  String? token;
  String studentName = "";
  String message = "";
  String? errorMessage;
  bool isLoading = false;

  final baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _loadTokenAndFetchStudentName();
  }

  Future<void> _loadTokenAndFetchStudentName() async {
    final prefs = await SharedPreferences.getInstance();
    token = prefs.getString('token');

    if (token == null) {
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/login');
      return;
    }

    if (widget.studentName != null) {
      setState(() => studentName = Uri.decodeComponent(widget.studentName!));
    } else {
      await _fetchStudentName();
    }
  }

  Future<void> _fetchStudentName() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/api/students/${widget.studentId}'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = json.decode(res.body);
      if (res.statusCode == 200) {
        final name = data['student_name'] ??
            data['name'] ??
            data['data']?['student_name'] ??
            data['data']?['name'];
        setState(() => studentName = name ?? 'Unknown Student');
      } else {
        setState(() => errorMessage = 'Failed to fetch student details');
      }
    } catch (e) {
      setState(() => errorMessage = 'Error fetching student: ${e.toString()}');
    }
  }

  Future<void> _sendMessage() async {
    if (!_formKey.currentState!.validate()) return;
    if (token == null) {
      setState(() => errorMessage = "Session expired. Please login again.");
      return;
    }

    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final res = await http.post(
        Uri.parse('$baseUrl/api/send-message'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'student_id': int.parse(widget.studentId),
          'message': message,
        }),
      );

      final data = json.decode(res.body);
      if (res.statusCode == 200) {
        if (!mounted) return;

        // ✅ Show success snackbar
        showCustomSnackBar(
          context,
          "Message sent successfully",
          backgroundColor: Colors.green,
        );

        await Future.delayed(const Duration(milliseconds: 500));
        if (!mounted) return;
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => TeacherDashboard()),
        );
      } else {
        setState(
            () => errorMessage = data['error'] ?? "Failed to send message");
      }
    } catch (e) {
      setState(() => errorMessage = 'Error sending message: ${e.toString()}');
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      // appBar: AppBar(
      //   title: Text("Message to $studentName"),
      //   centerTitle: true,
      // ),
      appBar: CustomAppBar(title: 'Send Message'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (errorMessage != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.errorContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    errorMessage!,
                    style: TextStyle(color: theme.colorScheme.onErrorContainer),
                    textAlign: TextAlign.center,
                  ),
                ),
              if (errorMessage != null) const SizedBox(height: 20),
              const SizedBox(height: 8),
              Text(
                "Recipient: $studentName",
                style: theme.textTheme.bodyLarge,
              ),
              const SizedBox(height: 20),
              TextFormField(
                maxLength: 200,
                maxLines: 6,
                minLines: 4,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter a message';
                  }
                  if (value.length > 200) {
                    return 'Message too long (max 200 characters)';
                  }
                  return null;
                },
                onChanged: (value) => setState(() => message = value),
                decoration: InputDecoration(
                  hintText: "Type your message here...",
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "${message.length}/200",
                    style: theme.textTheme.bodySmall?.copyWith(
                      color:
                          message.length > 200 ? theme.colorScheme.error : null,
                    ),
                  ),
                  CustomButton(
                    text: "Send",
                    onPressed: message.trim().isEmpty ? null : _sendMessage,
                    isLoading: isLoading,
                    icon: Icons.send,
                    // color: Colors.deepPurple,
                    textColor: Colors.white,
                    width: 120,
                    height: 40,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
