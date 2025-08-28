import 'package:flutter/material.dart';
import 'package:sms/pages/admin/admin_dashboard.dart';
import 'package:sms/pages/parents_dashboard/dashboard.dart';
import 'package:sms/pages/principle/principle_dashboard.dart';
import 'package:sms/pages/auth/forgotpassword.dart';
import 'package:sms/pages/profile_setting/profile_setup.dart';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/pages/services/auth_service.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/pages/services/profile_service.dart';
import 'package:sms/pages/teacher_dashboard/t_dashboard.dart';
import 'package:sms/widgets/custom_snackbar.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController usernameController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  bool _obscurePassword = true;

  final Color primaryColor = Colors.deepPurple;
  final Color backgroundColor = Colors.white;
  final Color inputFillColor = Colors.deepPurple.shade50;
  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final username = usernameController.text.trim();
      final password = passwordController.text.trim();

      final response = await AuthService.login(username, password);

      if (response['success'] == true) {
        if (response['user_email'] == null) {
          throw Exception('Server response missing user_email');
        }

        final prefs = await SharedPreferences.getInstance();
        await Future.wait([
          prefs.setString('token', response['token']),
          prefs.setString('role', response['role']),
          prefs.setString('user_email', response['user_email']),
          if (response['user_id'] != null)
            prefs.setString('user_id', response['user_id'].toString()),
        ]);
        if (!mounted) return;
        showCustomSnackBar(context, 'Login Successful',
            backgroundColor: Colors.green);

        // 🔁 Check if profile is set
        final profile = await ProfileService.getProfile();
        final isProfileSet = profile['success'] == true &&
            profile['data']['institute_name'] != null &&
            profile['data']['institute_name'].toString().isNotEmpty;

        if (!isProfileSet) {
          if (!mounted) return;
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const ProfileSetupPage()),
          );
        } else {
          _navigateToRoleDashboard(response['role']);
        }
      } else {
        setState(() {
          _errorMessage = response['message'] ?? 'Invalid Credentials';
        });
      }
    } catch (e) {
      debugPrint('Login error: $e');
      setState(() {
        _errorMessage = 'Login failed. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _navigateToRoleDashboard(String role) {
    Widget dashboard;

    switch (role.toLowerCase()) {
      case 'teacher':
        dashboard = const TeacherDashboard();
        break;
      case 'principal':
        dashboard = const PrincipleDashboard(); // Replace with your actual page
        break;
      case 'parents':
        dashboard = const ParentDashboard(); // Replace with your actual page
        break;
      case 'admin':
        dashboard = const AdminDashboard();
      default:
        dashboard = const PrincipleDashboard();
    }

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => dashboard),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 25),
        child: Center(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const CircleAvatar(
                  radius: 50,
                  backgroundImage: AssetImage('assets/images/almanet1.jpg'),
                ),
                const SizedBox(height: 20),
                Text(
                  "Login",
                  style: TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.bold,
                    color: primaryColor,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  "Welcome Back! Please enter your details.",
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                ),
                const SizedBox(height: 30),
                if (_errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 15),
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(
                        color: Colors.red,
                        fontSize: 16,
                      ),
                    ),
                  ),
                Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      buildTextField("Email/Username", Icons.person, false,
                          usernameController),
                      const SizedBox(height: 15),
                      buildTextField(
                          "Password", Icons.lock, true, passwordController),
                      const SizedBox(height: 25),
                      CustomButton(
                        text: "Log In",
                        onPressed: _login,
                        isLoading: _isLoading,
                        // color: primaryColor,
                        icon: Icons.login,
                      ),
                      const SizedBox(height: 20),
                      TextButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (context) => const ForgetPage()),
                          );
                        },
                        child: Text(
                          'Forgot Password?',
                          style: TextStyle(color: primaryColor),
                        ),
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

  Widget buildTextField(String hintText, IconData icon, bool isPassword,
      TextEditingController controller) {
    return TextFormField(
      controller: controller,
      obscureText: isPassword ? _obscurePassword : false,
      decoration: InputDecoration(
        prefixIcon: Icon(icon, color: primaryColor),
        hintText: hintText,
        hintStyle: const TextStyle(color: Colors.grey),
        filled: true,
        fillColor: inputFillColor,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
          borderSide: BorderSide.none,
        ),
        suffixIcon: isPassword
            ? IconButton(
                icon: Icon(
                  _obscurePassword ? Icons.visibility_off : Icons.visibility,
                  color: Colors.grey,
                ),
                onPressed: () {
                  setState(() {
                    _obscurePassword = !_obscurePassword;
                  });
                },
              )
            : null,
      ),
      validator: (value) {
        if (value == null || value.trim().isEmpty) {
          return 'Please enter your ${hintText.toLowerCase()}';
        }
        return null;
      },
    );
  }
}
