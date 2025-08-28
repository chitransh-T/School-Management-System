import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:sms/pages/auth/login.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/date_picker.dart';

class AttendanceRecord {
  final int attendanceId;
  final String studentName;
  final String className;
  final String section;
  final String date;
  final bool isPresent;

  AttendanceRecord({
    required this.attendanceId,
    required this.studentName,
    required this.className,
    required this.section,
    required this.date,
    required this.isPresent,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      attendanceId: json['attendance_id'],
      studentName: json['student_name'],
      className: json['class_name'],
      section: json['section'],
      date: json['date'],
      isPresent: json['is_present'],
    );
  }
}

class ViewAttendance extends StatefulWidget {
  const ViewAttendance({super.key});

  @override
  State<ViewAttendance> createState() => _ViewAttendanceState();
}

class _ViewAttendanceState extends State<ViewAttendance> {
  List<AttendanceRecord> _records = [];
  String? _selectedMonth;
  DateTime? _selectedDateObj;
  bool _isLoading = false;
  String? _errorMessage;
  String? _token;

  int _totalPresent = 0;
  int _totalAbsent = 0;

  final String _baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  @override
  void initState() {
    super.initState();
    _loadToken();
  }

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    final storedToken = prefs.getString('token');
    if (storedToken == null) {
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginPage()),
      );
    } else {
      setState(() => _token = storedToken);
    }
  }

  void _calculateSummary() {
    _totalPresent = _records.where((r) => r.isPresent).length;
    _totalAbsent = _records.length - _totalPresent;
  }

  Future<void> _fetchMonthData(String month) async {
    if (_token == null) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _totalPresent = 0;
      _totalAbsent = 0;
    });

    try {
      final response = await http.get(
        Uri.parse("$_baseUrl/api/parent/attendance/month/$month"),
        headers: {
          'Authorization': 'Bearer $_token',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      );

      final data = json.decode(response.body);
      if (response.statusCode == 200) {
        final List list = data['attendance'] ?? [];
        setState(() {
          _records =
              list.map((item) => AttendanceRecord.fromJson(item)).toList();
          _calculateSummary();
        });
      } else {
        setState(() {
          _records = [];
          _errorMessage =
              data['message'] ?? 'Failed to fetch monthly attendance';
          _totalPresent = 0;
          _totalAbsent = 0;
        });
      }
    } catch (e) {
      setState(() {
        _records = [];
        _errorMessage = 'Error: ${e.toString()}';
        _totalPresent = 0;
        _totalAbsent = 0;
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchDateData(String date) async {
    if (_token == null) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _totalPresent = 0;
      _totalAbsent = 0;
    });

    try {
      final response = await http.get(
        Uri.parse("$_baseUrl/api/parent/attendance/date/$date"),
        headers: {
          'Authorization': 'Bearer $_token',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      );

      final data = json.decode(response.body);
      if (response.statusCode == 200) {
        final List list = data['attendance'] ?? [];
        setState(() {
          _records =
              list.map((item) => AttendanceRecord.fromJson(item)).toList();
          // For date-wise, summary not required, so zero them
          _totalPresent = 0;
          _totalAbsent = 0;
        });
      } else {
        setState(() {
          _records = [];
          _errorMessage = data['message'] ?? 'Failed to fetch daily attendance';
          _totalPresent = 0;
          _totalAbsent = 0;
        });
      }
    } catch (e) {
      setState(() {
        _records = [];
        _errorMessage = 'Error: ${e.toString()}';
        _totalPresent = 0;
        _totalAbsent = 0;
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  String _formatDate(String dateStr) {
    final date = DateTime.parse(dateStr).toLocal();
    return DateFormat('EEE, dd MMM yyyy').format(date);
  }

  String _getMonthLabel(String monthStr) {
    try {
      final date = DateTime.parse(monthStr);
      return DateFormat('MMMM yyyy').format(date);
    } catch (_) {
      return monthStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: 'Attendance Report'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Filter Section
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const Text(
                      'Filter Attendance',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _selectedMonth,
                            decoration: InputDecoration(
                              labelText: 'Select Month',
                              border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10)),
                              contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 16),
                            ),
                            items: List.generate(12, (index) {
                              final monthDate =
                                  DateTime(DateTime.now().year, index + 1, 1);
                              final monthStr =
                                  DateFormat('yyyy-MM-01').format(monthDate);
                              return DropdownMenuItem(
                                value: monthStr,
                                child:
                                    Text(DateFormat('MMMM').format(monthDate)),
                              );
                            }),
                            onChanged: (value) {
                              setState(() {
                                _selectedMonth = value;
                                _selectedDateObj = null;
                              });
                              if (value != null) _fetchMonthData(value);
                            },
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: CustomDatePicker(
                            selectedDate: _selectedDateObj ?? DateTime.now(),
                            // labelText: 'Select Date',
                            firstDate: DateTime(2023),
                            lastDate: DateTime.now(),
                            onDateSelected: (picked) {
                              final dateStr =
                                  DateFormat('yyyy-MM-dd').format(picked);
                              setState(() {
                                _selectedDateObj = picked;
                                _selectedMonth = null;
                              });
                              _fetchDateData(dateStr);
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Error Message
            if (_errorMessage != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error, color: Colors.red),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: TextStyle(color: Colors.red.shade800),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: () => setState(() => _errorMessage = null),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 8),

            // Current Filter Info
            if (_selectedMonth != null || _selectedDateObj != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Text(
                  'Showing: ${_selectedMonth != null ? _getMonthLabel(_selectedMonth!) : _formatDate(_selectedDateObj.toString())}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),

            // Month-wise summary count (only show if month selected and records exist)
            if (_selectedMonth != null && _records.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 12.0),
                child: Row(
                  children: [
                    Chip(
                      backgroundColor: Colors.green.shade100,
                      label: Text(
                        'Total Present: $_totalPresent',
                        style: TextStyle(
                            color: Colors.green.shade700,
                            fontWeight: FontWeight.bold),
                      ),
                      avatar:
                          const Icon(Icons.check_circle, color: Colors.green),
                    ),
                    const SizedBox(width: 16),
                    Chip(
                      backgroundColor: Colors.red.shade100,
                      label: Text(
                        'Total Absent: $_totalAbsent',
                        style: TextStyle(
                            color: Colors.red.shade700,
                            fontWeight: FontWeight.bold),
                      ),
                      avatar: const Icon(Icons.cancel, color: Colors.red),
                    ),
                  ],
                ),
              ),

            // 👤 Student Name (display only once)
            if (_records.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  children: [
                    const Icon(Icons.person, size: 20, color: Colors.blueGrey),
                    const SizedBox(width: 8),
                    Text(
                      'Student: ${_records[0].studentName}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),

            // Attendance Records
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_records.isEmpty)
              Center(
                child: Column(
                  children: [
                    Icon(Icons.calendar_today_outlined,
                        size: 80, color: Colors.grey.shade300),
                    const SizedBox(height: 16),
                    Text(
                      'No attendance records found.',
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                  ],
                ),
              )
            else
              ListView.builder(
                physics: const NeverScrollableScrollPhysics(),
                shrinkWrap: true,
                itemCount: _records.length,
                itemBuilder: (context, index) {
                  final record = _records[index];
                  return Card(
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                    elevation: 2,
                    child: ListTile(
                      leading: Icon(
                        record.isPresent ? Icons.check_circle : Icons.cancel,
                        color: record.isPresent ? Colors.green : Colors.red,
                        size: 32,
                      ),
                      title: Text(_formatDate(record.date),
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                      // subtitle: Text(
                      //   '${record.className} - Section ${record.section}',
                      //   style: const TextStyle(color: Colors.grey),
                      // ),
                      trailing: Chip(
                        label: Text(record.isPresent ? 'Present' : 'Absent'),
                        backgroundColor: record.isPresent
                            ? Colors.green.shade100
                            : Colors.red.shade100,
                        labelStyle: TextStyle(
                          color: record.isPresent
                              ? Colors.green.shade700
                              : Colors.red.shade700,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
