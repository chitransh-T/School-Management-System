import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/pages/services/class_service.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';

class AddClassPage extends StatefulWidget {
  const AddClassPage({super.key});

  @override
  State<AddClassPage> createState() => _AddClassPageState();
}

class _AddClassPageState extends State<AddClassPage> {
  final _formKey = GlobalKey<FormState>();
  String _className = '';
  String? _selectedSection;
  // String _tuitionFees = '';
  // String? _selectedTeacherName;
  String? _selectedTeacherId;
  String? token;

  bool isLoading = false;
  bool isFetchingTeachers = false;
  List<Teacher> teachers = [];
  static final String baseeUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  final List<String> classOptions = [
    'Nursery',
    'LKG',
    'UKG',
    'class 1',
    'class 2',
    'class 3',
    'class 4',
    'class 5',
    'class 6',
    'class 7',
    'class 8',
    'class 9',
    'class 10',
    'class 11',
    'class 12',
  ];

  final List<String> sectionOptions = [
    'Section A',
    'Section B',
    'Section C',
    'Section D'
  ];

  @override
  void initState() {
    super.initState();
    _loadToken();
  }

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      token = prefs.getString('token');
    });

    if (token != null) {
      fetchTeachers();
    }
  }

  Future<void> fetchTeachers() async {
    if (token == null) return;

    setState(() {
      isFetchingTeachers = true;
    });

    try {
      final response = await http.get(
        Uri.parse('$baseeUrl/api/teachers'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token!,
        },
      );
      if (!mounted) return;
      if (response.statusCode == 200) {
        final List<dynamic> teacherData = json.decode(response.body);
        setState(() {
          teachers = teacherData
              .map((data) => Teacher(
                    id: data['id'].toString(),
                    name: data['teacher_name'],
                  ))
              .toList();
        });
      } else if (response.statusCode == 401) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('token');
        setState(() {
          token = null;
        });
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Session expired. Please login again.')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text('Failed to load teachers: ${response.reasonPhrase}')),
        );
      }
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(
                'Error connecting to server. Please check your connection.')),
      );
    } finally {
      setState(() {
        isFetchingTeachers = false;
      });
    }
  }

  Future<void> _submitForm() async {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();

      setState(() {
        isLoading = true;
      });

      try {
        final success = await ClassService.registerClass(
          className: _className,
          section: _selectedSection!,
          // tuitionFees: _tuitionFees,
          teacherId: _selectedTeacherId!,
        );
        if (!mounted) return;
        if (success) {
          showCustomSnackBar(context, 'Class created successfully',
              backgroundColor: Colors.green);
          await Future.delayed(Duration(seconds: 2));
          if (!mounted) return;
          Navigator.pop(context);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to add class'),
              backgroundColor: Colors.red[400],
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          );
        }
      } catch (error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error.toString().replaceFirst('Exception: ', '')),
            backgroundColor: Colors.red[400],
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        );
      } finally {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(
        title: 'Add New Class',
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Class Information',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.deepPurple[900],
                  ),
                ),
                SizedBox(height: 16),
                _buildClassDropdown(),
                SizedBox(height: 16),
                _buildSectionDropdown(),
                SizedBox(height: 24),
                if (token == null)
                  _buildWarningCard(
                      'You are not logged in. Please login to continue.')
                else if (isFetchingTeachers)
                  _buildLoadingIndicator('Loading teachers...')
                else if (teachers.isEmpty)
                  _buildWarningCard(
                      'No teachers found. Please add teachers first.')
                else
                  _buildTeacherDropdown(),
                SizedBox(height: 32),
                _buildSubmitButton(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildClassDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Select Class',
            style: TextStyle(color: Colors.deepPurple[900], fontSize: 16)),
        SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            // border: Border.all(color: Colors.deepPurple[900]!.withOpacity(0.3)),
            border: Border.all(
                color: Colors.deepPurple[900]!.withAlpha((0.3 * 255).round())),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: DropdownButtonFormField<String>(
              decoration: InputDecoration(
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 8),
              ),
              value: _className.isNotEmpty ? _className : null,
              onChanged: (String? newValue) {
                setState(() {
                  _className = newValue!;
                });
              },
              items: classOptions.map((className) {
                return DropdownMenuItem<String>(
                  value: className,
                  child: Text(className),
                );
              }).toList(),
              validator: (value) => value == null || value.isEmpty
                  ? 'Please select a class'
                  : null,
              style: TextStyle(color: Colors.deepPurple[900]),
              icon: Icon(Icons.arrow_drop_down, color: Colors.deepPurple[900]),
              dropdownColor: Colors.white,
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Select Section',
            style: TextStyle(color: Colors.deepPurple[900], fontSize: 16)),
        SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            // border: Border.all(color: Colors.deepPurple[900]!.withOpacity(0.3)),
            border: Border.all(
                color: Colors.deepPurple[900]!.withAlpha((0.3 * 255).round())),

            borderRadius: BorderRadius.circular(8),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: DropdownButtonFormField<String>(
              decoration: InputDecoration(
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 8),
              ),
              value: _selectedSection,
              onChanged: (String? newValue) {
                setState(() {
                  _selectedSection = newValue;
                });
              },
              items: sectionOptions.map((section) {
                return DropdownMenuItem<String>(
                  value: section,
                  child: Text(section),
                );
              }).toList(),
              validator: (value) =>
                  value == null ? 'Please select a section' : null,
              style: TextStyle(color: Colors.deepPurple[900]),
              icon: Icon(Icons.arrow_drop_down, color: Colors.deepPurple[900]),
              dropdownColor: Colors.white,
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTeacherDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Class Teacher',
            style: TextStyle(color: Colors.deepPurple[900], fontSize: 16)),
        SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            // border: Border.all(color: Colors.deepPurple[900]!.withOpacity(0.3)),
            border: Border.all(
                color: Colors.deepPurple[900]!.withAlpha((0.3 * 255).round())),

            borderRadius: BorderRadius.circular(8),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: DropdownButtonFormField<String>(
              decoration: InputDecoration(
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 8),
              ),
              value: _selectedTeacherId,
              onChanged: (String? newValue) {
                setState(() {
                  _selectedTeacherId = newValue;
                });
              },
              items: teachers.map((teacher) {
                return DropdownMenuItem<String>(
                  value: teacher.id,
                  child: Text(teacher.name),
                );
              }).toList(),
              validator: (value) =>
                  value == null ? 'Please select a teacher' : null,
              style: TextStyle(color: Colors.deepPurple[900]),
              icon: Icon(Icons.arrow_drop_down, color: Colors.deepPurple[900]),
              dropdownColor: Colors.white,
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildWarningCard(String message) {
    return Card(
      color: Colors.orange[50],
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Colors.orange[200]!),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Icon(Icons.warning, color: Colors.orange[800]),
            SizedBox(width: 16),
            Expanded(
                child:
                    Text(message, style: TextStyle(color: Colors.orange[800]))),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingIndicator(String message) {
    return Center(
      child: Column(
        children: [
          CircularProgressIndicator(color: Colors.deepPurple[900]),
          SizedBox(height: 16),
          Text(message, style: TextStyle(color: Colors.deepPurple[900])),
        ],
      ),
    );
  }

  Widget _buildSubmitButton() {
    return CustomButton(
      text: 'Add Class',
      isLoading: isLoading,
      onPressed: teachers.isEmpty ? () async {} : _submitForm,
    );
  }
}

class Teacher {
  final String id;
  final String name;

  Teacher({required this.id, required this.name});
}
