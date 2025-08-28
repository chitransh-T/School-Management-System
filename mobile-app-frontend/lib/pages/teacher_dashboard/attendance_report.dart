import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/pages/services/student_service.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/report_components.dart';
import 'package:sms/widgets/date_picker.dart';

class AttendanceReportPage extends StatefulWidget {
  const AttendanceReportPage({super.key});

  @override
  State<AttendanceReportPage> createState() => _AttendanceReportPageState();
}

class _AttendanceReportPageState extends State<AttendanceReportPage> {
  String? token;
  String? selectedClass;
  String? selectedClassId;
  String? selectedSection;
  DateTime selectedDate = DateTime.now();

  List<Map<String, dynamic>> attendanceRecords = [];
  bool isLoading = false;
  bool isError = false;
  String errorMessage = '';
  bool attendanceExists = false;
  bool isInitialLoading = true;

  static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    final prefs = await SharedPreferences.getInstance();
    token = prefs.getString('token');

    if (token == null) {
      _handleUnauthorized();
      return;
    }

    await _loadAssignedClass();
    setState(() => isInitialLoading = false);
  }

  Future<void> _loadAssignedClass() async {
    setState(() => isLoading = true);

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/assigned-class'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        selectedClass = data['class_name']?.toString();
        selectedClassId = data['class_id']?.toString();
        selectedSection = data['section']?.toString();

        await _fetchAttendanceReport();
      } else if (response.statusCode == 401) {
        _handleUnauthorized();
      } else {
        _handleError('Failed to load assigned class.');
      }
    } catch (e) {
      _handleError('Error loading class info: $e');
    } finally {
      setState(() => isLoading = false);
    }
  }

  Future<void> _fetchAttendanceReport() async {
    if (selectedClassId == null ||
        selectedSection == null ||
        token == null ||
        selectedClass == null) {
      return;
    }

    setState(() {
      isLoading = true;
      isError = false;
      attendanceExists = false;
      attendanceRecords = [];
    });

    try {
      // Fetch students for the selected class
      final studentService = StudentService();
      final students = await studentService.fetchStudentsByClass(
        selectedClass!,
        token!,
      );

      // Fetch attendance data
      final response = await http.get(
        Uri.parse(
            '$baseUrl/api/attendance/$selectedClassId/$selectedSection/${DateFormat('yyyy-MM-dd').format(selectedDate)}'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List attendanceData = data['students'] ?? data['data'] ?? [];

        // Create a map of student_id to is_present status
        final attendanceMap = {
          for (var item in attendanceData)
            (item['student_id']?.toString().trim() ?? ''):
                item['is_present'] ?? false,
        };

        // Filter students by section and map to attendance records
        setState(() {
          attendanceRecords = students
              .where((student) =>
                  student.assignedSection.trim() == selectedSection!.trim() &&
                  attendanceMap.containsKey(student.id))
              .map((student) => {
                    'student_id': student.id,
                    'student_name': student.name,
                    'is_present': attendanceMap[student.id] ?? false,
                    'section': student.assignedSection,
                  })
              .toList();
          attendanceExists = attendanceRecords.isNotEmpty;
        });
      } else if (response.statusCode == 401) {
        _handleUnauthorized();
      } else {
        _handleError('Failed to fetch attendance report.');
      }
    } catch (e) {
      _handleError('Error fetching attendance: $e');
    } finally {
      setState(() => isLoading = false);
    }
  }

  void _handleUnauthorized() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, '/login');
  }

  void _handleError(String message) {
    setState(() {
      isError = true;
      errorMessage = message;
      isLoading = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red[800],
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final presentCount =
        attendanceRecords.where((s) => s['is_present'] == true).length;
    final absentCount =
        attendanceRecords.where((s) => s['is_present'] == false).length;

    return Scaffold(
      appBar: CustomAppBar(title: 'Attendance Report'),
      body: isInitialLoading
          ? Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        ReportFilterCard(
                          title: 'Class & Date',
                          children: [
                            Text('Class: ${selectedClass ?? "N/A"}',
                                style: TextStyle(fontSize: 16)),
                            SizedBox(height: 4),
                            Text('Section: ${selectedSection ?? "N/A"}',
                                style: TextStyle(fontSize: 16)),
                            SizedBox(height: 12),
                            CustomDatePicker(
                              selectedDate: selectedDate,
                              onDateSelected: (DateTime newDate) {
                                setState(() => selectedDate = newDate);
                                _fetchAttendanceReport();
                              },
                              isExpanded: true,
                              lastDate: DateTime.now(),
                              backgroundColor: Colors.white,
                              foregroundColor: Colors.deepPurple,
                            ),
                          ],
                        ),
                        SizedBox(height: 16),
                        if (isLoading)
                          Container(
                            constraints: BoxConstraints(minHeight: 200),
                            child: Center(child: CircularProgressIndicator()),
                          ),
                        if (isError) _buildErrorState(),
                        if (!isLoading && !isError)
                          attendanceExists
                              ? _buildAttendanceList()
                              : _buildNoDataMessage(),
                      ],
                    ),
                  ),
                ),
                // Fixed bottom summary
                if (!isLoading && !isError && attendanceExists)
                  Container(
                    padding: EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.grey.withAlpha(71),
                          spreadRadius: 1,
                          blurRadius: 5,
                          offset: Offset(0, -2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildSummaryItem(
                            'Present', presentCount, Colors.green),
                        _buildSummaryItem('Absent', absentCount, Colors.red),
                        _buildSummaryItem(
                            'Total', attendanceRecords.length, Colors.blue),
                      ],
                    ),
                  ),
              ],
            ),
    );
  }

  Widget _buildErrorState() {
    return Container(
      constraints: BoxConstraints(minHeight: 200),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: Colors.red),
            SizedBox(height: 16),
            Text(errorMessage, textAlign: TextAlign.center),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchAttendanceReport,
              child: Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoDataMessage() {
    return Container(
      constraints: BoxConstraints(minHeight: 200),
      child: Center(
        child: Text(
          'No attendance records found for ${DateFormat.yMMMd().format(selectedDate)}.\n\nAttendance may not have been taken.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 16),
        ),
      ),
    );
  }

  Widget _buildAttendanceList() {
    return Column(
      children: [
        AttendanceListHeader(
          title: 'Attendance for $selectedClass - $selectedSection',
          date: selectedDate,
        ),
        AttendanceListHeaderRow(
          leftText: 'Student Name',
          rightText: 'Status',
        ),
        ListView.separated(
          shrinkWrap: true,
          physics: NeverScrollableScrollPhysics(),
          itemCount: attendanceRecords.length,
          separatorBuilder: (_, __) =>
              Divider(height: 1, color: Colors.blue[100]),
          itemBuilder: (_, index) {
            final student = attendanceRecords[index];
            return AttendanceListItem(
              name: student['student_name'] ?? 'Unknown',
              isPresent: student['is_present'] ?? false,
            );
          },
        ),
      ],
    );
  }

  Widget _buildSummaryItem(String label, int count, Color color) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 4),
        Container(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: color.withAlpha(51),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            count.toString(),
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ),
      ],
    );
  }
}
