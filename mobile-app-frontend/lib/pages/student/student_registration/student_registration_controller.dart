import 'dart:io';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:sms/pages/services/student_service.dart';
import 'package:file_picker/file_picker.dart';
import 'package:sms/widgets/custom_snackbar.dart';

class StudentRegistrationController {
  final formKey = GlobalKey<FormState>();

  final dobController =
      TextEditingController(); // optional, for text formatting
  DateTime? dob; // 👈 used with CustomDatePicker

  final studentNameController = TextEditingController();
  final registrationController = TextEditingController();
  final addressController = TextEditingController();
  final fathersNameController = TextEditingController();
  final mothersNameController = TextEditingController();
  final emailController = TextEditingController();
  final phoneController = TextEditingController();

  String? gender;
  String? selectedClass;
  String? selectedSection;

  XFile? studentPhoto;
  XFile? birthCertificate;

  String? studentPhotoName;
  String? birthCertificateName;

  bool isLoading = false;

  Future<void> pickFile(BuildContext context, bool isPhoto) async {
    if (isPhoto) {
      // Handle student photo
      if (!kIsWeb) {
        final pickedFile =
            await ImagePicker().pickImage(source: ImageSource.gallery);
        if (pickedFile != null) {
          studentPhoto = pickedFile;
          studentPhotoName = pickedFile.name;

          final fileSize = await studentPhoto!.length();
          if (fileSize < 100) {
            if (context.mounted) {
              // ScaffoldMessenger.of(context).showSnackBar(
              //   SnackBar(content: Text('Selected image is too small')),
              // );
              showCustomSnackBar(context, 'Selected image is too small',
                  backgroundColor: Colors.red);
            }
            studentPhoto = null;
            studentPhotoName = null;
            return;
          }
        }
      } else {
        FilePickerResult? result =
            await FilePicker.platform.pickFiles(type: FileType.image);
        if (result != null) {
          studentPhoto = XFile.fromData(result.files.single.bytes!);
          studentPhotoName = result.files.single.name;

          final fileSize = result.files.single.bytes!.length;
          if (fileSize < 100) {
            // ScaffoldMessenger.of(context).showSnackBar(
            //   SnackBar(content: Text('Selected image is too small')),
            // );
            if (context.mounted) {
              showCustomSnackBar(context, 'Selected image is too small',
                  backgroundColor: Colors.red);
            }
            studentPhoto = null;
            studentPhotoName = null;
            return;
          }
        }
      }
    } else {
      // Handle birth certificate
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
      );
      if (result != null) {
        if (kIsWeb) {
          birthCertificate = XFile.fromData(result.files.single.bytes!);
        } else {
          birthCertificate = XFile(result.files.single.path!);
        }
        birthCertificateName = result.files.single.name;
      }
    }
  }

  Future<bool> registerStudent(BuildContext context) async {
    if (!formKey.currentState!.validate()) return false;

    if (dob == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please select date of birth')),
      );
      return false;
    }

    try {
      final formattedDate = DateFormat('yyyy-MM-dd').format(dob!);
      final today = DateTime.now();

      int age = today.year - dob!.year;
      if (today.month < dob!.month ||
          (today.month == dob!.month && today.day < dob!.day)) {
        age--;
      }

      if (age < 5) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Student must be at least 5 years old')),
        );
        return false;
      }

      if (studentPhoto == null || birthCertificate == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Please upload all required documents')),
        );
        return false;
      }

      isLoading = true;

      var response = await StudentService.registerStudent(
        studentName: studentNameController.text,
        registrationNumber: registrationController.text,
        dob: formattedDate,
        gender: gender ?? 'Male',
        address: addressController.text,
        fatherName: fathersNameController.text,
        motherName: mothersNameController.text,
        email: emailController.text,
        phone: phoneController.text,
        assignedClass: selectedClass ?? '',
        assignedSection: selectedSection ?? '',
        studentPhoto: kIsWeb
            ? await studentPhoto?.readAsBytes()
            : File(studentPhoto?.path ?? ''),
        birthCertificate: kIsWeb
            ? await birthCertificate?.readAsBytes()
            : File(birthCertificate?.path ?? ''),
      );

      isLoading = false;

      if (!context.mounted) return false;

      if (response['success'] == true) {
        // ScaffoldMessenger.of(context).showSnackBar(
        //   SnackBar(content: Text('Student registered successfully')),
        // );
        showCustomSnackBar(context, 'Student registerd successfully',
            backgroundColor: Colors.green);
        return true;
      } else {
        // ScaffoldMessenger.of(context).showSnackBar(
        //   SnackBar(content: Text(response['message'] ?? 'Registration failed')),
        // );
        showCustomSnackBar(context, 'Registration failed',
            backgroundColor: Colors.red);
        return false;
      }
    } catch (e) {
      isLoading = false;
      showCustomSnackBar(
        context,
        'Error: $e',
        backgroundColor: Colors.red,
      );
      return false;
    }
  }

  Future<void> showConfirmationDialog(
      BuildContext context, Function() onConfirm) async {
    return showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Confirm Registration'),
          content: Text('Are you sure you want to register this student?'),
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

  Map<String, String> generateCredentials(
      String studentName, String registrationNumber) {
    String username = studentName.toLowerCase().replaceAll(RegExp(r'\s+'), '');
    if (username.length > 5) {
      username = username.substring(0, 5);
    }

    String regSuffix = registrationNumber.length > 4
        ? registrationNumber.substring(registrationNumber.length - 4)
        : registrationNumber;

    username = "$username$regSuffix";

    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final random = Random();
    String password =
        List.generate(8, (_) => chars[random.nextInt(chars.length)]).join();

    return {
      'username': username,
      'password': password,
    };
  }
}
