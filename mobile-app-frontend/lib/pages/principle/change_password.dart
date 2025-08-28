import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:sms/pages/principle/principle_dashboard.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_input_field.dart';
import 'package:sms/widgets/custom_snackbar.dart';

class ChangePasswordPage extends StatefulWidget {
  const ChangePasswordPage({super.key});

  @override
  State<ChangePasswordPage> createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends State<ChangePasswordPage> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  String? _email;
  String _error = '';
  String _success = '';
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  final TextEditingController currentPasswordController =
      TextEditingController();
  final TextEditingController newPasswordController = TextEditingController();
  final TextEditingController confirmPasswordController =
      TextEditingController();

  final Color primaryColor = Colors.deepPurple;
  final Color inputFillColor = Colors.deepPurple.shade50;

  @override
  void initState() {
    super.initState();
    loadEmail();
  }

  Future<void> loadEmail() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    if (token == null) {
      setState(() {
        _error = 'Authentication token not found. Please login again.';
      });
      return;
    }

    try {
      final decoded = parseJwt(token);
      if (decoded['role'] != 'principal') {
        setState(() {
          _error = 'Access denied. Only principals can change passwords.';
        });
        return;
      }
      setState(() {
        _email = decoded['email'];
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to decode token.';
      });
    }
  }

  Map<String, dynamic> parseJwt(String token) {
    final parts = token.split('.');
    if (parts.length != 3) throw Exception('Invalid token');
    final payload =
        utf8.decode(base64Url.decode(base64Url.normalize(parts[1])));
    return json.decode(payload);
  }

  Future<void> handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _error = '';
      _success = '';
    });

    final current = currentPasswordController.text.trim();
    final newPass = newPasswordController.text.trim();
    final confirm = confirmPasswordController.text.trim();

    if (newPass != confirm) {
      setState(() {
        _error = 'New passwords do not match.';
      });
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

    if (token == null || _email == null) {
      setState(() {
        _error = 'Session expired. Please login again.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final res = await http.post(
        Uri.parse('$baseUrl/api/auth/change-password'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': _email,
          'currentPassword': current,
          'newPassword': newPass,
        }),
      );

      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        setState(() {
          // _success = 'Password updated successfully.';
          currentPasswordController.clear();
          newPasswordController.clear();
          confirmPasswordController.clear();
        });

        showCustomSnackBar(context, 'Password updated successfully!',
            backgroundColor: Colors.green);

        await Future.delayed(const Duration(seconds: 1));

        if (!mounted) return;
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const PrincipleDashboard()),
        );
      } else {
        setState(() {
          _error = data['message'] ?? 'Failed to update password.';
        });
      }
    } catch (e) {
      setState(() {
        _error = 'An error occurred: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: 'Change Password'),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: _email == null && _error.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : Form(
                key: _formKey,
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      if (_error.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.all(10),
                          color: Colors.red[100],
                          child: Row(
                            children: [
                              const Icon(Icons.error, color: Colors.red),
                              const SizedBox(width: 8),
                              Expanded(
                                  child: Text(_error,
                                      style:
                                          const TextStyle(color: Colors.red))),
                            ],
                          ),
                        ),
                      if (_success.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.all(10),
                          color: Colors.green[100],
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle,
                                  color: Colors.green),
                              const SizedBox(width: 8),
                              Expanded(
                                  child: Text(_success,
                                      style: const TextStyle(
                                          color: Colors.green))),
                            ],
                          ),
                        ),
                      const SizedBox(height: 16),
                      CustomInputField(
                        label: 'Email',
                        icon: Icons.email,
                        controller: TextEditingController(text: _email ?? ''),
                        readOnly: true,
                      ),
                      const SizedBox(height: 15),
                      CustomInputField(
                        label: 'Current Password',
                        icon: Icons.lock,
                        controller: currentPasswordController,
                        obscureText: _obscureCurrent,
                        suffixIcon: _obscureCurrent
                            ? Icons.visibility_off
                            : Icons.visibility,
                        onSuffixTap: () => setState(() {
                          _obscureCurrent = !_obscureCurrent;
                        }),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter your current password';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 15),
                      CustomInputField(
                        label: 'New Password',
                        icon: Icons.lock,
                        controller: newPasswordController,
                        obscureText: _obscureNew,
                        suffixIcon: _obscureNew
                            ? Icons.visibility_off
                            : Icons.visibility,
                        onSuffixTap: () => setState(() {
                          _obscureNew = !_obscureNew;
                        }),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter your new password';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 15),
                      CustomInputField(
                        label: 'Re-enter New Password',
                        icon: Icons.lock,
                        controller: confirmPasswordController,
                        obscureText: _obscureConfirm,
                        suffixIcon: _obscureConfirm
                            ? Icons.visibility_off
                            : Icons.visibility,
                        onSuffixTap: () => setState(() {
                          _obscureConfirm = !_obscureConfirm;
                        }),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please re-enter your new password';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 25),
                      CustomButton(
                        text: 'Update Password',
                        onPressed: _isLoading ? null : handleSubmit,
                        isLoading: _isLoading,
                        icon: Icons.lock,
                      ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}
