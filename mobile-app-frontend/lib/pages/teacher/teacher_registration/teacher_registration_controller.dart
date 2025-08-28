import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:sms/pages/services/teacher_service.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path/path.dart' as path;
import 'package:sms/widgets/custom_snackbar.dart';

class TeacherRegistrationController {
  final formKey = GlobalKey<FormState>();
  final dobController = TextEditingController();
  final dojController = TextEditingController();
  final teacherNameController = TextEditingController();
  final registrationController = TextEditingController();
  final addressController = TextEditingController();
  final emailController = TextEditingController();
  final phoneController = TextEditingController();
  final teachersalaryController = TextEditingController();
  final teacherexperienceController = TextEditingController();
  final teacherqualificationController = TextEditingController();
  final guardianController = TextEditingController();
  final passwordController = TextEditingController();

  DateTime? dob;
  DateTime? doj;
  String? gender;
  XFile? teacherPhoto;
  XFile? qualificationCertificate;

  /// NEW: To hold actual file names
  String? teacherPhotoName;
  String? qualificationDocName;

  bool isLoading = false;

  void updateDob(DateTime newDate) {
    dob = newDate;
    dobController.text = DateFormat('dd-MM-yyyy').format(newDate);
  }

  void updateDoj(DateTime newDate) {
    doj = newDate;
    dojController.text = DateFormat('dd-MM-yyyy').format(newDate);
  }

  Future<void> pickFile(BuildContext context, bool isPhoto) async {
    try {
      if (isPhoto) {
        if (!kIsWeb) {
          final pickedFile =
              await ImagePicker().pickImage(source: ImageSource.gallery);
          if (pickedFile != null) {
            final fileSize = await pickedFile.length();
            if (fileSize < 100 * 1024) {
              throw Exception('Image too small (min 100KB)');
            }

            teacherPhoto = pickedFile;
            teacherPhotoName =
                path.basename(pickedFile.path); // ✅ store filename
          }
        } else {
          FilePickerResult? result =
              await FilePicker.platform.pickFiles(type: FileType.image);
          if (result != null && result.files.single.bytes != null) {
            if (result.files.single.bytes!.length < 100 * 1024) {
              throw Exception('Image too small (min 100KB)');
            }
            teacherPhoto = XFile.fromData(result.files.single.bytes!);
            teacherPhotoName = result.files.single.name; // ✅ store filename
          }
        }
      } else {
        FilePickerResult? result = await FilePicker.platform.pickFiles(
          type: FileType.custom,
          allowedExtensions: ['pdf'],
        );
        if (result != null && result.files.single.path != null) {
          qualificationCertificate = XFile(result.files.single.path!);
          qualificationDocName = result.files.single.name; // ✅ store filename
        }
      }
    } catch (e) {
      // ScaffoldMessenger.of(context).showSnackBar(
      //   SnackBar(content: Text(e.toString())),
      // );
      if (context.mounted) {
        showCustomSnackBar(
          context,
          'Error during registration: ${e.toString()}',
          backgroundColor: Colors.red,
        );
      }
    }
  }

  // Register teacher method
  Future<bool> registerteacher(BuildContext context) async {
    if (!formKey.currentState!.validate()) {
      return false;
    }

    // Validate dates
    if (dob == null) {
      showCustomSnackBar(context, 'Please select date of birth',
          backgroundColor: Colors.red);
      return false;
    }

    if (doj == null) {
      showCustomSnackBar(context, 'Please select date of joining',
          backgroundColor: Colors.red);
      return false;
    }

    // Validate documents
    if (teacherPhoto == null || qualificationCertificate == null) {
      // ScaffoldMessenger.of(context).showSnackBar(
      //   SnackBar(content: Text('Please upload all required documents')),
      // );
      showCustomSnackBar(context, 'Please upload all required documents',
          backgroundColor: Colors.red);
      return false;
    }

    try {
      isLoading = true;

      bool success = await TeacherService.registerTeacher(
        teacherName: teacherNameController.text,
        email: emailController.text,
        password: passwordController.text,
        dob: DateFormat('yyyy-MM-dd').format(dob!),
        doj: DateFormat('yyyy-MM-dd').format(doj!),
        gender: gender ?? 'Male',
        guardianName: guardianController.text,
        qualification: teacherqualificationController.text,
        experience: teacherexperienceController.text,
        salary: teachersalaryController.text,
        address: addressController.text,
        phone: phoneController.text,
        teacherPhoto: kIsWeb
            ? await teacherPhoto?.readAsBytes()
            : File(teacherPhoto?.path ?? ''),
        qualificationCertificate: kIsWeb
            ? await qualificationCertificate?.readAsBytes()
            : File(qualificationCertificate?.path ?? ''),
      );

      isLoading = false;

      if (success) {
        if (context.mounted) {
          showCustomSnackBar(context, 'Teacher registered successfully',
              backgroundColor: Colors.green);
        }
        return true;
      } else {
        // ScaffoldMessenger.of(context).showSnackBar(
        //   SnackBar(content: Text('Failed to register teacher')),
        // );
        if (context.mounted) {
          showCustomSnackBar(context, 'Failed to register teacher',
              backgroundColor: Colors.red);
        }
        return false;
      }
    } catch (e) {
      isLoading = false;
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error during registration: ${e.toString()}')),
        );
      }
      return false;
    }
  }

  // Show confirmation dialog
  Future<void> showConfirmationDialog(
      BuildContext context, Function() onConfirm) async {
    return showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Confirm Registration'),
          content: Text('Are you sure you want to register this teacher?'),
          actions: [
            TextButton(
              child: Text('Cancel'),
              onPressed: () => Navigator.of(context).pop(),
            ),
            TextButton(
              child: Text('Confirm'),
              onPressed: () {
                Navigator.of(context).pop();
                onConfirm();
              },
            ),
          ],
        );
      },
    );
  }

  // Clean up resources
  void dispose() {
    dobController.dispose();
    dojController.dispose();
    teacherNameController.dispose();
    registrationController.dispose();
    addressController.dispose();
    emailController.dispose();
    phoneController.dispose();
    teachersalaryController.dispose();
    teacherexperienceController.dispose();
    teacherqualificationController.dispose();
    guardianController.dispose();
    passwordController.dispose();
  }
}
