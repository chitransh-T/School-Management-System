import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:image_picker/image_picker.dart';
import 'package:sms/pages/services/student_service.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/custom_snackbar.dart';
import 'package:sms/widgets/user_photo_widget.dart';
import 'package:sms/widgets/date_picker.dart';
import 'package:sms/models/student_model.dart';
import 'package:sms/models/class_model.dart';

final String baseeUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';
final String uploadBaseUrl = '$baseeUrl/uploads';

class EditStudentDialog extends StatefulWidget {
  final Student student;
  final List<Class> classes;
  final Function() onStudentUpdated;

  const EditStudentDialog({
    super.key,
    required this.student,
    required this.classes,
    required this.onStudentUpdated,
  });

  @override
  State<EditStudentDialog> createState() => _EditStudentDialogState();
}

class _EditStudentDialogState extends State<EditStudentDialog> {
  late final TextEditingController _nameController;
  late final TextEditingController _registrationController;
  late final TextEditingController _dobController;
  late final TextEditingController _genderController;
  late final TextEditingController _addressController;
  late final TextEditingController _fatherNameController;
  late final TextEditingController _motherNameController;
  // late final TextEditingController _emailController;
  // late final TextEditingController _phoneController;

  String? _selectedClass;
  String? _selectedSection;
  List<String> _availableSections = [];
  String? _profilePhoto;
  Uint8List? _photoBytes;
  File? _selectedImage;
  bool _isLoading = false;
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.student.name);
    _registrationController =
        TextEditingController(text: widget.student.registrationNumber);
    _dobController =
        TextEditingController(text: _formatDate(widget.student.dateOfBirth));
    _genderController = TextEditingController(text: widget.student.gender);
    _addressController = TextEditingController(text: widget.student.address);
    _fatherNameController =
        TextEditingController(text: widget.student.fatherName);
    _motherNameController =
        TextEditingController(text: widget.student.motherName);
    // _emailController = TextEditingController(text: widget.student.email);
    // _phoneController = TextEditingController(text: widget.student.phone);
    _selectedClass = widget.student.assignedClass;
    _selectedSection = widget.student.assignedSection;
    _profilePhoto = widget.student.studentPhoto;

    if (_selectedClass != null) {
      _updateAvailableSections(_selectedClass!);
    }
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

  void _updateAvailableSections(String className) {
    final selectedClass = widget.classes.firstWhere(
      (c) => c.className == className,
      orElse: () => Class(id: '', className: '', sections: []),
    );
    setState(() {
      _availableSections = selectedClass.sections;
      if (!_availableSections.contains(_selectedSection)) {
        _selectedSection = null;
      }
    });
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
      final updatedStudent = {
        'student_name': _nameController.text,
        'registration_number': _registrationController.text,
        'date_of_birth': _parseDate(_dobController.text),
        'gender': _genderController.text,
        'address': _addressController.text,
        'father_name': _fatherNameController.text,
        'mother_name': _motherNameController.text,
        // 'email': _emailController.text,
        // 'phone': _phoneController.text,
        'assigned_class': _selectedClass,
        'assigned_section': _selectedSection,
        'birth_certificate': widget.student.birthCertificate,
        'student_photo': _profilePhoto ?? widget.student.studentPhoto,
      };

      final studentService = StudentService(); // ✅ FIXED
      await studentService.updateStudent(widget.student, updatedStudent);
      if (!mounted) return; // ✅ Prevents context use if widget disposed

      showCustomSnackBar(
        context,
        'Student updated successfully',
        backgroundColor: Colors.green,
      ); // ✅ FIXED

      widget.onStudentUpdated();
      Navigator.of(context).pop();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update student: ${e.toString()}')),
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
                'Edit Student',
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
                                    widget.student.studentPhoto, uploadBaseUrl),
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
                    // _buildEditField(
                    //     _registrationController, 'Registration Number', false),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: TextFormField(
                        controller: _registrationController,
                        readOnly: true,
                        decoration: InputDecoration(
                          labelText: 'Registration Number',
                          labelStyle: TextStyle(color: Colors.deepPurple[800]),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide:
                                BorderSide(color: Colors.deepPurple[300]!),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide(
                                color: Colors.deepPurple[800]!, width: 2),
                          ),
                          filled: true,
                          fillColor: Colors.deepPurple[50],
                          suffixIcon: Icon(Icons.lock,
                              color: Colors.grey[600]), // 🔒 lock icon
                        ),
                      ),
                    ),
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
                    _buildEditField(_genderController, 'Gender', true),
                    _buildEditField(_addressController, 'Address', true),
                    _buildEditField(_fatherNameController, 'Father Name', true),
                    _buildEditField(_motherNameController, 'Mother Name', true),
                    // _buildEditField(_emailController, 'Email', true),
                    // _buildEditField(_phoneController, 'Phone', true),
                    SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: _selectedClass,
                      decoration: InputDecoration(
                        labelText: 'Class',
                        labelStyle: TextStyle(color: Colors.deepPurple[800]),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              BorderSide(color: Colors.deepPurple[300]!),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(
                              color: Colors.deepPurple[800]!, width: 2),
                        ),
                        filled: true,
                        fillColor: Colors.deepPurple[50],
                      ),
                      items: [
                        DropdownMenuItem(
                          value: null,
                          child: Text('Select Class',
                              style: TextStyle(color: Colors.deepPurple[900])),
                        ),
                        ...widget.classes.map((classItem) {
                          return DropdownMenuItem<String>(
                            value: classItem.className,
                            child: Text(classItem.className,
                                style:
                                    TextStyle(color: Colors.deepPurple[900])),
                          );
                        }),
                      ],
                      onChanged: (String? newValue) {
                        setState(() {
                          _selectedClass = newValue;
                          _selectedSection = null;
                          if (newValue != null) {
                            _updateAvailableSections(newValue);
                          } else {
                            _availableSections = [];
                          }
                        });
                      },
                    ),
                    SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: _selectedSection,
                      decoration: InputDecoration(
                        labelText: 'Section',
                        labelStyle: TextStyle(color: Colors.deepPurple[800]),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              BorderSide(color: Colors.deepPurple[300]!),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(
                              color: Colors.deepPurple[800]!, width: 2),
                        ),
                        filled: true,
                        fillColor: Colors.deepPurple[50],
                      ),
                      items: [
                        DropdownMenuItem(
                          value: null,
                          child: Text('Select Section',
                              style: TextStyle(color: Colors.deepPurple[900])),
                        ),
                        ..._availableSections.map((value) {
                          return DropdownMenuItem<String>(
                            value: value,
                            child: Text(value,
                                style:
                                    TextStyle(color: Colors.deepPurple[900])),
                          );
                        }),
                      ],
                      onChanged: (String? newValue) {
                        setState(() {
                          _selectedSection = newValue;
                        });
                      },
                    ),
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
                  )
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
