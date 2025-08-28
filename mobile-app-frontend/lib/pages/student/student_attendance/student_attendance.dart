import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/pages/principle/principle_dashboard.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/attendance_components.dart';
import 'package:sms/pages/services/attendance_service.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';
import 'package:sms/widgets/date_picker.dart';
import 'package:sms/widgets/class_section_selector.dart';
import 'package:sms/pages/services/student_service.dart';
import 'package:sms/models/student_model.dart';
import 'package:sms/widgets/search_bar.dart';

class StudentAttendancePage extends StatefulWidget {
  const StudentAttendancePage({super.key});

  @override
  State<StudentAttendancePage> createState() => _StudentAttendancePageState();
}

class _StudentAttendancePageState extends State<StudentAttendancePage> {
  DateTime selectedDate = DateTime.now();
  List<Student> allStudents = [];
  List<Student> filteredStudents = [];
  TextEditingController searchController = TextEditingController();
  String? token;
  bool isLoading = false;
  bool _isInitialLoading = true;

  ClassModel? selectedClass;
  String? selectedSection;

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
      await _fetchAllStudents();
    } else {
      if (!mounted) return;
      showCustomSnackBar(context, 'Please login to continue',
          backgroundColor: Colors.red);
    }
    setState(() {
      _isInitialLoading = false;
    });
  }

  Future<void> _fetchAllStudents() async {
    if (token == null) {
      return showCustomSnackBar(context, 'Please login to continue',
          backgroundColor: Colors.red);
    }

    setState(() {
      isLoading = true;
      allStudents = [];
    });

    try {
      final studentService = StudentService();
      final fetchedStudents = await studentService.fetchStudents();
      if (!mounted) return;
      setState(() {
        allStudents = fetchedStudents;
        _filterStudents();
      });
    } catch (error) {
      if (!mounted) return;
      showCustomSnackBar(context, 'Error connecting to server: $error',
          backgroundColor: Colors.red);
    } finally {
      setState(() => isLoading = false);
    }
  }

  void _filterStudents() {
    setState(() {
      filteredStudents = allStudents.where((student) {
        final nameMatch = student.name
            .toLowerCase()
            .contains(searchController.text.toLowerCase());
        final classMatch = selectedClass == null ||
            (student.assignedClass.trim().toLowerCase() ==
                selectedClass!.className.trim().toLowerCase());
        final sectionMatch = selectedSection == null ||
            (student.assignedSection.trim().toLowerCase() ==
                selectedSection?.trim().toLowerCase());

        return nameMatch && classMatch && sectionMatch;
      }).toList();
    });
  }

  Future<void> saveAttendance() async {
    if (token == null) {
      return showCustomSnackBar(context, 'Please login to continue',
          backgroundColor: Colors.red);
    }
    if (selectedClass == null) {
      return showCustomSnackBar(context, 'Please select a class',
          backgroundColor: Colors.red);
    }
    if (selectedSection == null) {
      return showCustomSnackBar(context, 'Please select a section',
          backgroundColor: Colors.red);
    }

    setState(() => isLoading = true);

    final attendanceData = filteredStudents
        .map((student) => {
              'student_id': student.id,
              'is_present': student.isPresent,
              'class_id': selectedClass!.id,
              'section': selectedSection,
            })
        .toList();

    final result = await AttendanceService.saveAttendance(
      token: token!,
      date: selectedDate,
      students: attendanceData,
    );
    if (!mounted) return;
    if (result['success'] == true) {
      showCustomSnackBar(context, result['message'],
          backgroundColor: Colors.green);
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const PrincipleDashboard()),
      );
    } else {
      showCustomSnackBar(context, result['message'],
          backgroundColor: Colors.red);
    }

    setState(() => isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final deepPurpleTheme = Colors.deepPurple.shade800;
    final screenHeight = MediaQuery.of(context).size.height;
    final isLandscape =
        MediaQuery.of(context).orientation == Orientation.landscape;

    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Attendance Management',
      ),
      body: _isInitialLoading
          ? _buildLoadingIndicator(deepPurpleTheme)
          : SingleChildScrollView(
              child: Padding(
                padding: EdgeInsets.all(isLandscape ? 8.0 : 16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildFilterCard(isLandscape, deepPurpleTheme),
                    SizedBox(height: isLandscape ? 8 : 16),
                    if (token == null)
                      _buildLoginPrompt(isLandscape, deepPurpleTheme),
                    if (token != null && isLoading)
                      _buildLoadingIndicator(deepPurpleTheme),
                    if (token != null && !isLoading)
                      _buildStudentList(
                          isLandscape, deepPurpleTheme, screenHeight),
                    if (token != null)
                      _buildSaveButton(isLandscape, deepPurpleTheme),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildLoadingIndicator(Color deepPurpleTheme) {
    return Center(
      child: CircularProgressIndicator(
        valueColor: AlwaysStoppedAnimation<Color>(deepPurpleTheme),
      ),
    );
  }

  Widget _buildFilterCard(bool isLandscape, Color deepPurpleTheme) {
    return AttendanceFilterCard(
      child: Column(
        children: [
          ClassSectionSelector(
            onSelectionChanged: (ClassModel? cls, String? sec) {
              setState(() {
                selectedClass = cls;
                selectedSection = sec;
                _filterStudents();
              });
            },
            initialClass: selectedClass,
            initialSection: selectedSection,
          ),
          SizedBox(height: isLandscape ? 8 : 16),
          Row(
            children: [
              Expanded(child: _buildDatePicker(isLandscape, deepPurpleTheme)),
              SizedBox(width: isLandscape ? 8 : 10),
              Expanded(child: _buildSearchField(isLandscape, deepPurpleTheme)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDatePicker(bool isLandscape, Color deepPurpleTheme) {
    return CustomDatePicker(
      selectedDate: selectedDate,
      onDateSelected: (DateTime pickedDate) {
        setState(() => selectedDate = pickedDate);
      },
      labelText: 'Attendance Date',
      isExpanded: true,
      // labelStyle: TextStyle(
      //   color: deepPurpleTheme,
      //   fontSize: isLandscape ? 12 : 14,
      // ),
    );
  }

  Widget _buildSearchField(bool isLandscape, Color deepPurpleTheme) {
    return CustomSearchBar(
      hintText: 'Search Student',
      controller: searchController,
      onChanged: (_) => _filterStudents(),
      onClear: () {
        _filterStudents();
      },
      // hintStyle: TextStyle(
      //   color: Colors.grey.shade600,
      //   fontSize: isLandscape ? 12 : 14,
      // ),
    );
  }

  Widget _buildLoginPrompt(bool isLandscape, Color deepPurpleTheme) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: EdgeInsets.all(isLandscape ? 8.0 : 16.0),
        child: Column(
          children: [
            Icon(
              Icons.warning,
              size: isLandscape ? 36 : 48,
              color: Colors.orange,
            ),
            SizedBox(height: isLandscape ? 8 : 16),
            Text(
              'You are not logged in. Please login to continue.',
              style: TextStyle(
                fontSize: isLandscape ? 14 : 16,
                color: Colors.grey.shade600,
              ),
            ),
            SizedBox(height: isLandscape ? 8 : 16),
            ElevatedButton(
              onPressed: () {/* Navigate to login */},
              style: ElevatedButton.styleFrom(
                backgroundColor: deepPurpleTheme,
                foregroundColor: Colors.white,
                padding: EdgeInsets.symmetric(
                  horizontal: isLandscape ? 16 : 24,
                  vertical: isLandscape ? 8 : 12,
                ),
              ),
              child: Text(
                'Go to Login',
                style: TextStyle(fontSize: isLandscape ? 12 : 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStudentList(
      bool isLandscape, Color deepPurpleTheme, double screenHeight) {
    return SizedBox(
      height: isLandscape ? screenHeight * 0.5 : screenHeight * 0.6,
      child: filteredStudents.isEmpty
          ? _buildEmptyState(isLandscape, deepPurpleTheme)
          : ListView.separated(
              itemCount: filteredStudents.length,
              separatorBuilder: (_, __) =>
                  SizedBox(height: isLandscape ? 4 : 8),
              itemBuilder: (context, index) {
                final student = filteredStudents[index];
                return AttendanceListItem(
                  id: student.id,
                  name: student.name,
                  subtitle:
                      '${student.assignedClass} - ${student.assignedSection}',
                  isPresent: student.isPresent,
                  onChanged: (bool value) {
                    setState(() => student.isPresent = value);
                  },
                  // textStyle: TextStyle(
                  //   fontSize: isLandscape ? 12 : 14,
                  //   color: Colors.grey.shade600,
                  // ),
                );
              },
            ),
    );
  }

  Widget _buildEmptyState(bool isLandscape, Color deepPurpleTheme) {
    return Center(
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: Padding(
          padding: EdgeInsets.all(isLandscape ? 8.0 : 16.0),
          child: Text(
            selectedClass == null && selectedSection == null
                ? 'Please select a class and section to view students'
                : selectedClass == null
                    ? 'Please select a class to view students'
                    : selectedSection == null
                        ? 'Please select a section to view students'
                        : 'No students found for ${selectedClass!.className} - $selectedSection',
            style: TextStyle(
              fontSize: isLandscape ? 14 : 16,
              color: Colors.grey.shade600,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }

  Widget _buildSaveButton(bool isLandscape, Color deepPurpleTheme) {
    return CustomButton(
      text: 'Save',
      icon: Icons.save_alt,
      width: isLandscape ? 120 : 150,
      onPressed: filteredStudents.isEmpty ? null : saveAttendance,
      isLoading: isLoading,
    );
  }
}
