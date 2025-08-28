import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';
import 'package:sms/widgets/date_picker.dart';
import 'package:sms/widgets/report_components.dart';
import 'package:sms/pages/services/report_service.dart';

class TeacherAttendance {
  final String teacherId;
  final String teacherName;
  final bool isPresent;

  TeacherAttendance({
    required this.teacherId,
    required this.teacherName,
    required this.isPresent,
  });

  factory TeacherAttendance.fromJson(Map<String, dynamic> json) {
    return TeacherAttendance(
      teacherId: (json['teacher_id'] ?? '').toString().trim(),
      teacherName:
          (json['teacher_name'] ?? 'Unknown Teacher').toString().trim(),
      isPresent: _parseAttendanceStatus(json['is_present']),
    );
  }
}

bool _parseAttendanceStatus(dynamic status) {
  if (status == null) return false;
  if (status is bool) return status;
  if (status is int) return status == 1;
  if (status is String) {
    return status.toLowerCase() == 'true' || status == '1';
  }
  return false;
}

class TeacherReportPage extends StatefulWidget {
  const TeacherReportPage({super.key});

  @override
  State<TeacherReportPage> createState() => _TeacherReportPageState();
}

class _TeacherReportPageState extends State<TeacherReportPage> {
  DateTime selectedDate = DateTime.now();
  List<TeacherAttendance> attendanceRecords = [];
  String? token;
  bool isLoading = false;
  bool isError = false;
  String errorMessage = '';
  bool attendanceExists = false;

  @override
  void initState() {
    super.initState();
    _loadToken();
  }

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    token = prefs.getString('token');
    if (token != null) {
      await fetchAttendance();
    } else {
      _handleError('Please login to continue');
    }
  }

  Future<void> fetchAttendance() async {
    if (token == null) {
      _handleError('Please login to continue');
      return;
    }

    setState(() {
      isLoading = true;
      isError = false;
      attendanceExists = false;
    });

    final result = await ReportService.fetchReport(
      token: token!,
      endpoint: 'attendance',
      date: selectedDate,
    );

    if (!mounted) return;

    setState(() {
      isLoading = false;

      if (result['success'] == true) {
        if (result['unauthorized'] == true) {
          _handleUnauthorized();
          return;
        }

        attendanceExists = result['exists'] ?? false;

        if (attendanceExists) {
          attendanceRecords = (result['data']['teachers'] ?? [])
              .map<TeacherAttendance>(
                (item) => TeacherAttendance.fromJson(item),
              )
              .toList();
        }
      } else {
        _handleError(result['message']);
      }
    });
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
    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Teacher Attendance Report',
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  children: [
                    _buildFilterCard(),
                    const SizedBox(height: 12),
                    if (token == null)
                      _buildLoginPrompt()
                    else if (isLoading)
                      Container(
                        constraints: BoxConstraints(
                            minHeight:
                                MediaQuery.of(context).size.height * 0.4),
                        child: const Center(child: CircularProgressIndicator()),
                      )
                    else if (isError)
                      _buildErrorState()
                    else if (!attendanceExists)
                      _buildNoRecordsFound()
                    else
                      _buildAttendanceList(),
                  ],
                ),
              ),
            ),
          ),
          if (token != null && attendanceExists) _buildFixedSummary(),
        ],
      ),
    );
  }

  Widget _buildFilterCard() {
    return ReportFilterCard(
      title: 'Select Date',
      children: [
        CustomDatePicker(
          selectedDate: selectedDate,
          onDateSelected: (DateTime pickedDate) {
            setState(() => selectedDate = pickedDate);
            fetchAttendance();
          },
          labelText: 'Select Date',
          isExpanded: true,
        ),
      ],
    );
  }

  Widget _buildLoginPrompt() {
    return Container(
      constraints:
          BoxConstraints(minHeight: MediaQuery.of(context).size.height * 0.4),
      child: Center(
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.warning, size: 48, color: Colors.orange),
                const SizedBox(height: 16),
                const Text(
                  'You are not logged in. Please login to continue.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pushReplacementNamed(context, '/login');
                  },
                  child: const Text('Go to Login'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Container(
      constraints:
          BoxConstraints(minHeight: MediaQuery.of(context).size.height * 0.4),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(errorMessage, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: fetchAttendance,
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoRecordsFound() {
    return Container(
      constraints:
          BoxConstraints(minHeight: MediaQuery.of(context).size.height * 0.4),
      child: Center(
        child: Text(
          'No attendance records found for teachers on ${DateFormat.yMd().format(selectedDate)}.\n\n'
          'Attendance may not have been taken for this date.',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 16, color: Colors.red),
        ),
      ),
    );
  }

  Widget _buildAttendanceList() {
    return Column(
      children: [
        AttendanceListHeader(
          title: 'Attendance for Teachers',
          date: selectedDate,
        ),
        const AttendanceListHeaderRow(
          leftText: 'Teacher Name',
          rightText: 'Status',
        ),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: attendanceRecords.length,
          separatorBuilder: (_, __) =>
              Divider(height: 1, color: Colors.deepPurple[100]),
          itemBuilder: (_, index) => AttendanceListItem(
            name: attendanceRecords[index].teacherName,
            isPresent: attendanceRecords[index].isPresent,
          ),
        ),
      ],
    );
  }

  Widget _buildFixedSummary() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withAlpha(77),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildSummaryItem(
            'Present',
            attendanceRecords.where((a) => a.isPresent).length,
            Colors.green,
          ),
          _buildSummaryItem(
            'Absent',
            attendanceRecords.where((a) => !a.isPresent).length,
            Colors.red,
          ),
          _buildSummaryItem(
            'Total',
            attendanceRecords.length,
            Colors.blue,
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, int count, Color color) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
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
