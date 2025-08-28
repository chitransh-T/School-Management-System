import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/report_components.dart';
import 'package:sms/pages/services/report_service.dart';
import 'package:sms/widgets/date_picker.dart';
import 'package:sms/widgets/class_section_selector.dart';
import 'package:sms/widgets/custom_snackbar.dart';
import 'package:sms/pages/services/student_service.dart';
import 'package:sms/models/student_model.dart';

class StudentReportPage extends StatefulWidget {
  const StudentReportPage({super.key});

  @override
  State<StudentReportPage> createState() => _StudentReportPageState();
}

class _StudentReportPageState extends State<StudentReportPage> {
  DateTime selectedDate = DateTime.now();
  List<Student> attendanceRecords = [];
  String? token;
  bool isLoading = false;
  bool isError = false;
  String errorMessage = '';
  bool attendanceExists = false;
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
    setState(() => token = prefs.getString('token'));
    if (token == null) {
      if (!mounted) return;
      showCustomSnackBar(context, 'Please login to continue',
          backgroundColor: Colors.red);
    }
    setState(() => _isInitialLoading = false);
  }

  Future<void> fetchAttendance() async {
    if (token == null) {
      _handleError('Please login to continue');
      return;
    }
    if (selectedClass == null || selectedSection == null) {
      _handleError('Please select both class and section');
      return;
    }

    setState(() {
      isLoading = true;
      isError = false;
      attendanceExists = false;
      attendanceRecords = [];
    });

    try {
      // Fetch students for the selected class and section
      final studentService = StudentService();
      final students = await studentService.fetchStudentsByClass(
        selectedClass!.className,
        token!,
      );

      // Fetch attendance data
      final result = await ReportService.fetchReport(
        token: token!,
        endpoint: 'attendance',
        date: selectedDate,
        classId: selectedClass!.id.toString(),
        section: selectedSection!,
      );

      if (!mounted) return;

      if (result['success'] == true) {
        if (result['unauthorized'] == true) {
          _handleUnauthorized();
          return;
        }

        attendanceExists = result['exists'] ?? false;

        if (attendanceExists &&
            result['data'] != null &&
            result['data']['students'] != null) {
          final attendanceData = (result['data']['students'] as List?) ?? [];
          final attendanceMap = {
            for (var item in attendanceData)
              (item['student_id'] ?? '').toString().trim():
                  _parseAttendanceStatus(item['is_present']),
          };

          // Map students to attendance records, applying section filter
          // Map section-specific attendance only
          attendanceRecords = students
              .where((student) =>
                  student.assignedSection.trim() == selectedSection?.trim() &&
                  attendanceMap.containsKey(student.id))
              .map((student) => Student(
                    id: student.id,
                    name: student.name,
                    registrationNumber: student.registrationNumber,
                    dateOfBirth: student.dateOfBirth,
                    gender: student.gender,
                    address: student.address,
                    fatherName: student.fatherName,
                    motherName: student.motherName,
                    email: student.email,
                    phone: student.phone,
                    assignedClass: student.assignedClass,
                    assignedSection: student.assignedSection,
                    birthCertificate: student.birthCertificate,
                    studentPhoto: student.studentPhoto,
                    admissionDate: student.admissionDate,
                    username: student.username,
                    password: student.password,
                    createdAt: student.createdAt,
                    isPresent: attendanceMap[student.id] ?? false,
                  ))
              .toList();

          // Verify if any students were found for the section
          if (attendanceRecords.isEmpty && attendanceExists) {
            attendanceExists = false; // No students match the section
          }
        } else {
          attendanceExists = false; // Explicitly set to false if no data
        }
      } else {
        _handleError(result['message'] ?? 'Failed to fetch attendance data');
      }
    } catch (e) {
      _handleError('Error fetching attendance: $e');
    } finally {
      setState(() => isLoading = false);
    }
  }

  static bool _parseAttendanceStatus(dynamic status) {
    if (status == null) return false;
    if (status is bool) return status;
    if (status is int) return status == 1;
    if (status is String) {
      return status.toLowerCase() == 'true' || status == '1';
    }
    return false;
  }

  void _handleUnauthorized() async {
    await ReportService.handleUnauthorized();
    setState(() => token = null);
    if (!mounted) return;
    showCustomSnackBar(context, 'Session expired. Please login again.',
        backgroundColor: Colors.red);
  }

  void _handleError(String message) {
    setState(() {
      isError = true;
      errorMessage = message;
      isLoading = false;
    });
    showCustomSnackBar(context, message, backgroundColor: Colors.red);
  }

  @override
  Widget build(BuildContext context) {
    final deepPurpleTheme = Colors.deepPurple.shade800;
    final screenHeight = MediaQuery.of(context).size.height;
    final isLandscape =
        MediaQuery.of(context).orientation == Orientation.landscape;

    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Student Attendance Report',
      ),
      body: _isInitialLoading
          ? _buildLoadingIndicator(deepPurpleTheme)
          : SingleChildScrollView(
              child: Padding(
                padding: EdgeInsets.all(isLandscape ? 8.0 : 16.0),
                child: Column(
                  children: [
                    _buildFilterCard(isLandscape, deepPurpleTheme),
                    SizedBox(height: isLandscape ? 8 : 16),
                    if (token == null)
                      _buildLoginPrompt(isLandscape, deepPurpleTheme),
                    if (token != null)
                      _buildReportBody(
                          isLandscape, deepPurpleTheme, screenHeight),
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
    return ReportFilterCard(
      title: 'Select Class, Section and Date',
      children: [
        ClassSectionSelector(
          onSelectionChanged: (ClassModel? cls, String? sec) {
            setState(() {
              selectedClass = cls;
              selectedSection = sec;
              if (cls != null && sec != null) {
                fetchAttendance();
              } else {
                attendanceRecords = [];
                attendanceExists = false;
              }
            });
          },
          initialClass: selectedClass,
          initialSection: selectedSection,
        ),
        SizedBox(height: isLandscape ? 8 : 12),
        CustomDatePicker(
          selectedDate: selectedDate,
          onDateSelected: (DateTime newDate) {
            setState(() => selectedDate = newDate);
            if (selectedClass != null && selectedSection != null) {
              fetchAttendance();
            }
          },
          isExpanded: true,
          backgroundColor: Colors.deepPurple.shade50,
          foregroundColor: deepPurpleTheme,
        ),
      ],
    );
  }

  Widget _buildLoginPrompt(bool isLandscape, Color deepPurpleTheme) {
    return SizedBox(
      height: isLandscape ? 200 : 300,
      child: Center(
        child: Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: EdgeInsets.all(isLandscape ? 8.0 : 16.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.warning,
                  size: isLandscape ? 36 : 48,
                  color: Colors.orange,
                ),
                SizedBox(height: isLandscape ? 8 : 16),
                Text(
                  'You are not logged in. Please login to continue.',
                  textAlign: TextAlign.center,
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
                    style: TextStyle(
                      fontSize: isLandscape ? 12 : 14,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildReportBody(
      bool isLandscape, Color deepPurpleTheme, double screenHeight) {
    if (isLoading) {
      return SizedBox(
        height: isLandscape ? screenHeight * 0.5 : screenHeight * 0.6,
        child: Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(deepPurpleTheme),
          ),
        ),
      );
    }
    if (isError) return _buildErrorState(isLandscape, deepPurpleTheme);
    if (selectedClass == null || selectedSection == null) {
      return _buildSelectionPrompt(isLandscape);
    }
    if (!attendanceExists) return _buildNoRecordsFound(isLandscape);
    return _buildAttendanceList(isLandscape, deepPurpleTheme, screenHeight);
  }

  Widget _buildErrorState(bool isLandscape, Color deepPurpleTheme) {
    return SizedBox(
      height: isLandscape ? 200 : 300,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: isLandscape ? 36 : 48,
              color: Colors.red,
            ),
            SizedBox(height: isLandscape ? 8 : 16),
            Text(
              errorMessage,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: isLandscape ? 14 : 16,
                color: Colors.grey.shade600,
              ),
            ),
            SizedBox(height: isLandscape ? 8 : 16),
            ElevatedButton(
              onPressed: fetchAttendance,
              style: ElevatedButton.styleFrom(
                backgroundColor: deepPurpleTheme,
                foregroundColor: Colors.white,
                padding: EdgeInsets.symmetric(
                  horizontal: isLandscape ? 16 : 24,
                  vertical: isLandscape ? 8 : 12,
                ),
              ),
              child: Text(
                'Try Again',
                style: TextStyle(
                  fontSize: isLandscape ? 12 : 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSelectionPrompt(bool isLandscape) {
    return SizedBox(
      height: isLandscape ? 200 : 300,
      child: Center(
        child: Text(
          'Please select both class and section to view attendance',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: isLandscape ? 14 : 16,
            color: Colors.grey.shade600,
          ),
        ),
      ),
    );
  }

  Widget _buildNoRecordsFound(bool isLandscape) {
    return SizedBox(
      height: isLandscape ? 200 : 300,
      child: Center(
        child: Text(
          'No attendance records found for ${selectedClass!.className} - $selectedSection '
          'on ${DateFormat.yMd().format(selectedDate)}.\n\n'
          'Attendance has not been marked for this class and section.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: isLandscape ? 14 : 16,
            color: Colors.grey.shade600,
          ),
        ),
      ),
    );
  }

  Widget _buildAttendanceList(
      bool isLandscape, Color deepPurpleTheme, double screenHeight) {
    return SizedBox(
      height: isLandscape ? screenHeight * 0.6 : screenHeight * 0.7,
      child: SingleChildScrollView(
        child: Column(
          children: [
            AttendanceListHeader(
              title:
                  'Attendance for ${selectedClass!.className} - $selectedSection',
              date: selectedDate,
            ),
            AttendanceListHeaderRow(
              leftText: 'Student Name',
              rightText: 'Status',
            ),
            SizedBox(
              height: isLandscape ? screenHeight * 0.4 : screenHeight * 0.5,
              child: ListView.separated(
                itemCount: attendanceRecords.length,
                separatorBuilder: (_, __) =>
                    Divider(height: 1, color: Colors.deepPurple.shade100),
                itemBuilder: (_, index) => AttendanceListItem(
                  name: attendanceRecords[index].name,
                  isPresent: attendanceRecords[index].isPresent,
                ),
              ),
            ),
            AttendanceSummary(
              presentCount: attendanceRecords.where((a) => a.isPresent).length,
              absentCount: attendanceRecords.where((a) => !a.isPresent).length,
              totalCount: attendanceRecords.length,
            ),
          ],
        ),
      ),
    );
  }
}
