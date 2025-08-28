import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:image_picker/image_picker.dart';
import 'package:sms/pages/services/teacher_service.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/user_photo_widget.dart';
import 'package:sms/widgets/date_picker.dart';
import 'package:sms/models/teacher_model.dart';

final String baseeUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';
final String uploadBaseUrl = '$baseeUrl/uploads';

class EditTeacherDialog extends StatefulWidget {
  final Teacher teacher;
  final Function() onTeacherUpdated;

  const EditTeacherDialog({
    super.key,
    required this.teacher,
    required this.onTeacherUpdated,
  });

  @override
  State<EditTeacherDialog> createState() => _EditTeacherDialogState();
}

class _EditTeacherDialogState extends State<EditTeacherDialog> {
  late final TextEditingController _nameController;
  late final TextEditingController _dobController;
  late final TextEditingController _dojController;
  late final TextEditingController _genderController;
  late final TextEditingController _guardianController;
  late final TextEditingController _qualificationController;
  late final TextEditingController _experienceController;
  late final TextEditingController _salaryController;
  late final TextEditingController _addressController;
  // late final TextEditingController _phoneController;

  String? _profilePhoto;
  Uint8List? _photoBytes;
  File? _selectedImage;
  bool _isLoading = false;
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.teacher.name);
    _dobController =
        TextEditingController(text: _formatDate(widget.teacher.dateOfBirth));
    _dojController =
        TextEditingController(text: _formatDate(widget.teacher.dateOfJoining));
    _genderController = TextEditingController(text: widget.teacher.gender);
    _guardianController =
        TextEditingController(text: widget.teacher.guardian_name);
    _qualificationController =
        TextEditingController(text: widget.teacher.qualification);
    _experienceController =
        TextEditingController(text: widget.teacher.experience);
    _salaryController = TextEditingController(text: widget.teacher.salary);
    _addressController = TextEditingController(text: widget.teacher.address);
    // _phoneController = TextEditingController(text: widget.teacher.phone);
    _profilePhoto = widget.teacher.teacherPhoto;
  }

  String _formatDate(String dateString) {
    try {
      DateTime date = DateTime.parse(dateString).toLocal();
      return "${date.day.toString().padLeft(2, '0')}-${date.month.toString().padLeft(2, '0')}-${date.year}";
    } catch (e) {
      return dateString;
    }
  }

  String _parseDate(String formattedDate) {
    try {
      if (formattedDate.isEmpty) return '';
      List<String> parts = formattedDate.split('-');
      if (parts.length != 3) return formattedDate;
      DateTime date = DateTime(
        int.parse(parts[2]),
        int.parse(parts[1]),
        int.parse(parts[0]),
      );
      return "${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}";
    } catch (e) {
      return formattedDate;
    }
  }

  Future<void> _updatePhoto() async {
    final pickedFile =
        await ImagePicker().pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      if (kIsWeb) {
        final bytes = await pickedFile.readAsBytes();
        setState(() {
          _photoBytes = bytes;
          _profilePhoto = base64Encode(bytes);
        });
      } else {
        setState(() {
          _selectedImage = File(pickedFile.path);
          _profilePhoto = pickedFile.path;
        });
      }
    }
  }

  Future<void> _saveChanges() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final updatedTeacher = {
        'teacher_name': _nameController.text,
        'date_of_birth': _parseDate(_dobController.text),
        'date_of_joining': _parseDate(_dojController.text),
        'gender': _genderController.text,
        'guardian_name': _guardianController.text,
        'qualification': _qualificationController.text,
        'experience': _experienceController.text,
        'salary': _salaryController.text,
        'address': _addressController.text,
        // 'phone': _phoneController.text,
        'qualification_certificate': widget.teacher.qualificationCertificate,
        'teacher_photo': _profilePhoto ?? widget.teacher.teacherPhoto,
      };

      await TeacherService.updateTeacher(widget.teacher, updatedTeacher);
      widget.onTeacherUpdated();
      if (context.mounted) {
        // ignore: use_build_context_synchronously
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Teacher updated successfully'),
            backgroundColor: Colors.green[800],
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            duration: Duration(seconds: 3),
          ),
        );
      }
      if (!mounted) return;
      Navigator.of(context).pop();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update teacher: ${e.toString()}')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: EdgeInsets.all(20),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Edit Teacher',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.deepPurple[800],
                ),
              ),
              SizedBox(height: 20),
              Form(
                key: _formKey,
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        Column(
                          children: [
                            Text(
                              'Current Photo',
                              style: TextStyle(
                                color: Colors.deepPurple[800],
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            SizedBox(height: 8),
                            Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.deepPurple[100]!,
                                  width: 2,
                                ),
                              ),
                              child: ClipOval(
                                child: buildUserPhoto(
                                    widget.teacher.teacherPhoto, uploadBaseUrl),
                              ),
                            ),
                          ],
                        ),
                        if (_selectedImage != null || _photoBytes != null)
                          Column(
                            children: [
                              Text(
                                'New Photo',
                                style: TextStyle(
                                  color: Colors.deepPurple[800],
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: 8),
                              Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: Colors.green[100]!,
                                    width: 2,
                                  ),
                                ),
                                child: ClipOval(
                                  child: kIsWeb
                                      ? Image.memory(_photoBytes!,
                                          fit: BoxFit.cover)
                                      : Image.file(_selectedImage!,
                                          fit: BoxFit.cover),
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                    SizedBox(height: 20),
                    CustomButton(
                      text: 'Update Photo',
                      icon: Icons.camera_alt,
                      onPressed: _updatePhoto,
                      height: 45,
                      width: 190,
                    ),
                    SizedBox(height: 20),
                    _buildEditField(_nameController, 'Name', true),

                    CustomDatePicker(
                      selectedDate:
                          DateTime.tryParse(_parseDate(_dobController.text)) ??
                              DateTime.now(),
                      onDateSelected: (DateTime newDate) {
                        setState(() {
                          _dobController.text =
                              "${newDate.day.toString().padLeft(2, '0')}-${newDate.month.toString().padLeft(2, '0')}-${newDate.year}";
                        });
                      },
                      labelText: 'Date of Birth',
                      isExpanded: true,
                      backgroundColor: Colors.deepPurple[50],
                      foregroundColor: Colors.deepPurple[800],
                      firstDate: DateTime(1900),
                      lastDate: DateTime.now(),
                    ),

                    SizedBox(height: 16),

                    CustomDatePicker(
                      selectedDate:
                          DateTime.tryParse(_parseDate(_dojController.text)) ??
                              DateTime.now(),
                      onDateSelected: (DateTime newDate) {
                        setState(() {
                          _dojController.text =
                              "${newDate.day.toString().padLeft(2, '0')}-${newDate.month.toString().padLeft(2, '0')}-${newDate.year}";
                        });
                      },
                      labelText: 'Date of Joining',
                      isExpanded: true,
                      backgroundColor: Colors.deepPurple[50],
                      foregroundColor: Colors.deepPurple[800],
                      firstDate: DateTime(2000),
                      lastDate: DateTime.now(),
                    ),

                    SizedBox(height: 16),
                    _buildEditField(_genderController, 'Gender', true),
                    _buildEditField(_guardianController, 'Guardian Name', true),
                    _buildEditField(
                        _qualificationController, 'Qualification', true),
                    _buildEditField(_experienceController, 'Experience', true),
                    _buildEditField(_salaryController, 'Salary', true),
                    _buildEditField(_addressController, 'Address', true),
                    // _buildEditField(_phoneController, 'Phone', true),
                  ],
                ),
              ),
              SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: Text(
                      'Cancel',
                      style: TextStyle(color: Colors.grey[700]),
                    ),
                  ),
                  SizedBox(width: 10),
                  CustomButton(
                    text: 'Save',
                    icon: Icons.save_alt,
                    onPressed: _isLoading ? null : _saveChanges,
                    isLoading: _isLoading,
                    height: 45,
                    width: 120,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEditField(
      TextEditingController controller, String label, bool required) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        decoration: InputDecoration(
          labelText: label,
          labelStyle: TextStyle(color: Colors.deepPurple[800]),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Colors.deepPurple[300]!),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Colors.deepPurple[800]!, width: 2),
          ),
          filled: true,
          fillColor: Colors.deepPurple[50],
        ),
        validator: required
            ? (value) => value!.isEmpty ? '$label is required' : null
            : null,
      ),
    );
  }
}
