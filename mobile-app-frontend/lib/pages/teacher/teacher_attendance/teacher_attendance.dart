import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/pages/principle/principle_dashboard.dart';
import 'package:sms/pages/services/teacher_service.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/attendance_components.dart';
import 'package:sms/pages/services/attendance_service.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';
import 'package:sms/widgets/date_picker.dart';
import 'package:sms/widgets/search_bar.dart';

class TeacherAttendancePage extends StatefulWidget {
  const TeacherAttendancePage({super.key});

  @override
  State<TeacherAttendancePage> createState() => _TeacherAttendancePageState();
}

class _TeacherAttendancePageState extends State<TeacherAttendancePage> {
  DateTime selectedDate = DateTime.now();
  List<Teacher> teachers = [];
  List<bool> originalAttendanceStates =
      []; // To store original states for reset
  TextEditingController searchController = TextEditingController();
  String? token;
  bool isLoading = false;
  bool _isInitialLoading = true;

  @override
  void initState() {
    super.initState();
    _loadToken();
  }

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() => token = prefs.getString('token'));

    if (token != null) {
      setState(() => isLoading = true);
      try {
        final fetchedTeachers = await fetchTeachers(token!);
        setState(() {
          teachers = fetchedTeachers;
          // Store original states
          originalAttendanceStates = teachers.map((t) => t.isPresent).toList();
        });
      } catch (e) {
        if (!mounted) return;
        showCustomSnackBar(context, "Error fetching teachers: $e",
            backgroundColor: Colors.red);
      }
      setState(() => isLoading = false);
    }

    setState(() => _isInitialLoading = false);
  }

  static Future<List<Teacher>> fetchTeachers(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/teachers'),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data
          .map((e) => Teacher(
                e['id'].toString(),
                e['teacher_name'],
                false,
              ))
          .toList();
    } else {
      throw Exception('Failed to load teachers');
    }
  }

  Future<void> saveAttendance() async {
    if (token == null) {
      return showCustomSnackBar(context, 'Please login to continue',
          backgroundColor: Colors.red);
    }

    setState(() => isLoading = true);

    final attendanceData = teachers
        .map((teacher) => {
              'teacher_id': teacher.id,
              'is_present': teacher.isPresent,
            })
        .toList();

    final result = await AttendanceService.saveAttendance(
      token: token!,
      date: selectedDate,
      teachers: attendanceData,
    );
    if (!mounted) return;

    if (result['success'] == true) {
      showCustomSnackBar(context, result['message'],
          backgroundColor: Colors.green);
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => PrincipleDashboard()),
      );
    } else {
      showCustomSnackBar(context, result['message'],
          backgroundColor: Colors.red);
    }

    setState(() => isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Teacher Attendance',
        centerTitle: true,
        elevation: 0,
      ),
      body: _isInitialLoading ? _buildLoadingIndicator() : _buildBody(),
    );
  }

  Widget _buildLoadingIndicator() {
    return const Center(child: CircularProgressIndicator());
  }

  Widget _buildBody() {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildFilterCard(),
                  const SizedBox(height: 16),
                  if (token == null) _buildLoginPrompt(),
                  if (token != null && isLoading) _buildLoadingIndicator(),
                  if (token != null && !isLoading) _buildTeacherList(),
                ],
              ),
            ),
          ),
        ),
        if (token != null) _buildActionButtons(),
      ],
    );
  }

  Widget _buildFilterCard() {
    return AttendanceFilterCard(
      child: LayoutBuilder(
        builder: (context, constraints) {
          if (constraints.maxWidth > 600) {
            return Row(
              children: [
                Expanded(child: _buildDatePicker()),
                const SizedBox(width: 10),
                Expanded(child: _buildSearchField()),
              ],
            );
          } else {
            return Column(
              children: [
                _buildDatePicker(),
                const SizedBox(height: 10),
                _buildSearchField(),
              ],
            );
          }
        },
      ),
    );
  }

  Widget _buildDatePicker() {
    return CustomDatePicker(
      selectedDate: selectedDate,
      onDateSelected: (DateTime pickedDate) {
        setState(() => selectedDate = pickedDate);
      },
      labelText: 'Attendance Date',
      isExpanded: true,
    );
  }

  Widget _buildSearchField() {
    return CustomSearchBar(
      hintText: 'Search Teacher',
      controller: searchController,
      onChanged: (_) => setState(() {}),
      onClear: () => setState(() {}),
    );
  }

  Widget _buildLoginPrompt() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Icon(Icons.warning, size: 48, color: Colors.orange),
            const SizedBox(height: 16),
            const Text('You are not logged in. Please login to continue.',
                style: TextStyle(fontSize: 16)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {/* Navigate to login */},
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.deepPurple,
                foregroundColor: Colors.white,
              ),
              child: const Text('Go to Login'),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildTeacherList() {
    final filteredTeachers = teachers
        .where((teacher) => teacher.name
            .toLowerCase()
            .contains(searchController.text.toLowerCase()))
        .toList();

    return filteredTeachers.isEmpty
        ? _buildEmptyState()
        : ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: filteredTeachers.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final teacher = filteredTeachers[index];
              return AttendanceListItem(
                id: teacher.id,
                name: teacher.name,
                isPresent: teacher.isPresent,
                onChanged: (bool value) {
                  setState(() => teacher.isPresent = value);
                },
              );
            },
          );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child:
              const Text('No teachers found', style: TextStyle(fontSize: 16)),
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Container(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          SizedBox(
            child: CustomButton(
              width: 140,
              text: 'Save',
              icon: Icons.save_alt,
              isLoading: isLoading,
              onPressed: teachers.isEmpty ? null : saveAttendance,
            ),
          ),
        ],
      ),
    );
  }
}

class Teacher {
  final String id;
  final String name;
  bool isPresent;

  Teacher(this.id, this.name, this.isPresent);
}
