import 'package:google_fonts/google_fonts.dart';
import 'package:sms/pages/admin/admin_dashboard.dart';
import 'package:sms/pages/services/auth_service.dart';
import 'otp_verification.dart';
import 'package:sms/widgets/button.dart';
import 'package:flutter/material.dart';

class SignUpPage extends StatefulWidget {
  const SignUpPage({super.key});

  @override
  SignUpPageState createState() => SignUpPageState();
}

class SignUpPageState extends State<SignUpPage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _schoolIdController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  String _selectedRole = 'principal';
  bool isEmailVerified = false;
  bool isPhoneVerified = false;
  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  bool _isSigningUp = false;

  final List<String> roles = ['admin', 'principal'];
  Future<void> _register() async {
    if (!isEmailVerified || !isPhoneVerified) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
              'Please verify both email and phone number before registering.'),
        ),
      );
      return;
    }

    setState(() {
      _isSigningUp = true;
    });
    final success = await AuthService.register(
      _emailController.text.trim(),
      _phoneController.text.trim(),
      _passwordController.text.trim(),
      _confirmPasswordController.text.trim(),
      _selectedRole,
      schoolId: _schoolIdController.text.trim(),
    );

    setState(() {
      _isSigningUp = false;
    });
    if (!mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Registration Successful!')),
      );
      Navigator.pushReplacement(
          context, MaterialPageRoute(builder: (_) => const AdminDashboard()));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Email Already Exists. Try Again!')),
      );
    }
  }

  void _navigateToOTPPage(String type) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => OTPVerificationPage()),
    );

    if (result == true) {
      setState(() {
        if (type == "email") {
          isEmailVerified = true;
        } else {
          isPhoneVerified = true;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // final theme = Theme.of(context);
    // final isDarkMode = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: Text("Register",
            style: GoogleFonts.poppins(color: Colors.white, fontSize: 20)),
        centerTitle: true,
        backgroundColor: Colors.blue.shade900,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20.0),
        child: Center(
          child: SingleChildScrollView(
            child: Card(
              elevation: 6,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      _buildTitle("Create an Account"),
                      const SizedBox(height: 20),
                      _buildBasicTextField(
                        hintText: "School ID",
                        icon: Icons.school,
                        controller: _schoolIdController,
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        hintText: "Email",
                        icon: Icons.email,
                        controller: _emailController,
                        isPassword: false,
                        isVerified: isEmailVerified,
                        type: "email",
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        hintText: "Phone Number",
                        icon: Icons.phone,
                        controller: _phoneController,
                        isPassword: false,
                        isVerified: isPhoneVerified,
                        type: "phone",
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        hintText: "Password",
                        icon: Icons.lock,
                        controller: _passwordController,
                        isPassword: true,
                        isVerified: false,
                        type: "",
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        hintText: "Re-Enter Password",
                        icon: Icons.lock_outline,
                        controller: _confirmPasswordController,
                        isPassword: true,
                        isVerified: false,
                        type: "",
                      ),
                      const SizedBox(height: 16),
                      _buildDropdown(),
                      const SizedBox(height: 24),
                      _buildSignUpButton(),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTitle(String text) {
    return Text(
      text,
      style: GoogleFonts.poppins(
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: Colors.blue.shade900,
      ),
    );
  }

  Widget _buildTextField({
    required String hintText,
    required IconData icon,
    required TextEditingController controller,
    required bool isPassword,
    required bool isVerified,
    required String type,
  }) {
    bool isVisible =
        hintText == "Password" ? _isPasswordVisible : _isConfirmPasswordVisible;

    return TextFormField(
      controller: controller,
      obscureText: isPassword && !isVisible,
      decoration: InputDecoration(
        prefixIcon: Icon(icon, color: Colors.blue.shade900),
        hintText: hintText,
        filled: true,
        fillColor: Colors.grey.shade200,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        suffixIcon: isPassword
            ? IconButton(
                icon: Icon(
                  isVisible ? Icons.visibility : Icons.visibility_off,
                  color: Colors.grey,
                ),
                onPressed: () {
                  setState(() {
                    if (hintText == "Password") {
                      _isPasswordVisible = !_isPasswordVisible;
                    } else {
                      _isConfirmPasswordVisible = !_isConfirmPasswordVisible;
                    }
                  });
                },
              )
            : (isVerified
                ? const Icon(Icons.check_circle, color: Colors.green)
                : (type.isNotEmpty
                    ? TextButton(
                        onPressed: () => _navigateToOTPPage(type),
                        child: const Text("Verify",
                            style: TextStyle(color: Colors.blue)),
                      )
                    : null)),
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Please enter $hintText';
        }
        if (hintText == "Re-Enter Password" &&
            value != _passwordController.text) {
          return 'Passwords do not match';
        }
        return null;
      },
    );
  }

  Widget _buildBasicTextField({
    required String hintText,
    required IconData icon,
    required TextEditingController controller,
  }) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        prefixIcon: Icon(icon, color: Colors.blue.shade900),
        hintText: hintText,
        filled: true,
        fillColor: Colors.grey.shade200,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Please enter $hintText';
        }
        return null;
      },
    );
  }

  Widget _buildDropdown() {
    return DropdownButtonFormField<String>(
      value: _selectedRole,
      items: roles.map((String role) {
        return DropdownMenuItem<String>(
          value: role,
          child: Text(role, style: GoogleFonts.poppins()),
        );
      }).toList(),
      onChanged: (newRole) {
        setState(() {
          _selectedRole = newRole!;
        });
      },
      decoration: InputDecoration(
        labelText: 'Select Role',
        prefixIcon: const Icon(Icons.account_circle),
        filled: true,
        fillColor: Colors.grey.shade200,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }

  Widget _buildSignUpButton() {
    return CustomButton(
      text: "Sign Up",
      isLoading: _isSigningUp,
      onPressed: () async {
        if (_formKey.currentState!.validate()) {
          _register();
          // You can remove this Snackbar if _register handles it
        }
      },
    );
  }
}
