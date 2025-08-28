import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/pages/principle/principle_dashboard.dart';
import 'package:sms/pages/services/profile_service.dart';
import 'dart:io';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';
import 'package:sms/widgets/custom_input_field.dart';

class ProfileSetupPage extends StatefulWidget {
  const ProfileSetupPage({super.key});

  @override
  State<ProfileSetupPage> createState() => _ProfileSetupPageState();
}

class _ProfileSetupPageState extends State<ProfileSetupPage> {
  final TextEditingController _instituteNameController =
      TextEditingController();
  final TextEditingController _addressController = TextEditingController();

  XFile? _logoFile;
  Uint8List? _logoBytes;
  String? logoUrlFull;

  bool isLoading = false;
  String error = '';
  String? token;
  String? userEmail;

  final String baseeUrl = "http://localhost:1000";

  final Color primaryColor = Colors.deepPurple;
  final Color inputFillColor = Colors.deepPurple.shade50;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    setState(() => isLoading = true);
    final prefs = await SharedPreferences.getInstance();
    token = prefs.getString('token');
    userEmail = prefs.getString('user_email');

    if (token == null || userEmail == null) {
      setState(() {
        error = 'User not authenticated.';
        isLoading = false;
      });
      return;
    }

    await _loadProfileFromApi();
  }

  Future<void> _loadProfileFromApi() async {
    try {
      final result = await ProfileService.getProfile();

      if (result['success'] == true) {
        final data = result['data'];
        _instituteNameController.text = data['institute_name'] ?? '';
        _addressController.text = data['address'] ?? '';

        final logoUrl = data['logo_url'] as String?;
        if (logoUrl != null && logoUrl.isNotEmpty) {
          final cleanBaseUrl = baseeUrl.endsWith('/')
              ? baseeUrl.substring(0, baseeUrl.length - 1)
              : baseeUrl;
          final cleanLogoUrl = logoUrl.startsWith('/') ? logoUrl : '/$logoUrl';

          setState(() {
            logoUrlFull = cleanBaseUrl + cleanLogoUrl;
            _logoBytes = null;
            _logoFile = null;
          });
        } else {
          setState(() {
            logoUrlFull = null;
            _logoBytes = null;
            _logoFile = null;
          });
        }
      } else {
        setState(() => error = result['message'] ?? 'Failed to fetch profile');
      }
    } catch (e) {
      setState(() => error = 'Error: $e');
    } finally {
      setState(() => isLoading = false);
    }
  }

  Future<void> _pickLogoImage() async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(source: ImageSource.gallery);

      if (pickedFile != null) {
        final bytes = await pickedFile.readAsBytes();
        if (bytes.length < 100) {
          if (!mounted) return;
          showCustomSnackBar(context, 'Selected image is too small',
              backgroundColor: Colors.red);
          return;
        }

        setState(() {
          _logoFile = pickedFile;
          _logoBytes = bytes;
          logoUrlFull = null;
        });
      }
    } catch (e) {
      if (!mounted) return;
      showCustomSnackBar(context, 'Error picking image: $e',
          backgroundColor: Colors.red);
    }
  }

  Future<void> _saveProfile() async {
    if (_instituteNameController.text.isEmpty ||
        _addressController.text.isEmpty ||
        (_logoBytes == null && _logoFile == null && logoUrlFull == null)) {
      showCustomSnackBar(context, 'All fields including logo are required',
          backgroundColor: Colors.red);
      return;
    }

    setState(() => isLoading = true);

    try {
      final result = await ProfileService.saveProfile(
        instituteName: _instituteNameController.text.trim(),
        address: _addressController.text.trim(),
        logo: _logoFile != null
            ? (kIsWeb ? _logoBytes! : File(_logoFile!.path))
            : null,
      );

      if (!mounted) return;

      showCustomSnackBar(
        context,
        result['message'] ?? 'Profile saved successfully!',
        backgroundColor: result['success'] == true ? Colors.green : Colors.red,
      );

      if (result['success'] == true) {
        // ✅ Directly navigate to PrincipleDashboard only
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const PrincipleDashboard()),
        );
      }
    } catch (e) {
      showCustomSnackBar(context, 'Error saving profile: $e',
          backgroundColor: Colors.red);
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(title: 'Set Up Institute Profile'),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : error.isNotEmpty
              ? Center(child: Text(error))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      GestureDetector(
                        onTap: _pickLogoImage,
                        child: Container(
                          width: 130,
                          height: 130,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                                color: primaryColor.withOpacity(0.5), width: 2),
                          ),
                          child: Stack(
                            children: [
                              if (_logoBytes != null)
                                ClipOval(
                                  child: Image.memory(
                                    _logoBytes!,
                                    width: 130,
                                    height: 130,
                                    fit: BoxFit.cover,
                                  ),
                                )
                              else if (logoUrlFull != null)
                                ClipOval(
                                  child: Image.network(
                                    logoUrlFull!,
                                    width: 130,
                                    height: 130,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, _, __) =>
                                        const Icon(Icons.broken_image,
                                            size: 40, color: Colors.grey),
                                  ),
                                )
                              else
                                const Center(
                                  child: Icon(
                                    Icons.add_a_photo,
                                    size: 40,
                                    color: Colors.grey,
                                  ),
                                ),
                              Positioned(
                                bottom: 0,
                                right: 0,
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    color: primaryColor,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.edit,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 15),
                      Text(
                        'Tap to select Institute Logo',
                        style: TextStyle(
                            fontSize: 16,
                            color: primaryColor,
                            fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 30),
                      CustomInputField(
                        label: 'Institute Name',
                        icon: Icons.school,
                        controller: _instituteNameController,
                      ),
                      const SizedBox(height: 20),
                      CustomInputField(
                        label: 'Institute Address',
                        icon: Icons.location_on,
                        controller: _addressController,
                        maxLines: 3,
                      ),
                      const SizedBox(height: 30),
                      CustomButton(
                        text: 'Save Profile',
                        onPressed: _saveProfile,
                        icon: Icons.save_alt,
                      ),
                    ],
                  ),
                ),
    );
  }
}
