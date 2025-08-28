import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/sidebar.dart';
import 'package:sms/widgets/notice_widget.dart'; // Import the new NoticeWidget
import 'package:url_launcher/url_launcher.dart';

class ParentDashboard extends StatefulWidget {
  const ParentDashboard({super.key});

  @override
  State<ParentDashboard> createState() => _ParentDashboardState();
}

class _ParentDashboardState extends State<ParentDashboard> {
  bool isLoading = true;
  String? errorMessage;
  List<Map<String, dynamic>> studentData = [];
  final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  @override
  void initState() {
    super.initState();
    fetchParentStudents();
  }

  Future<void> fetchParentStudents() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) {
      setState(() {
        errorMessage = 'Token missing. Please login again.';
        isLoading = false;
      });
      return;
    }

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/dashboard/students'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List students = data['data'] ?? [];

        setState(() {
          studentData = students
              .map<Map<String, dynamic>>((s) => Map<String, dynamic>.from(s))
              .toList();
          isLoading = false;
        });
      } else {
        setState(() {
          errorMessage = 'Failed to load student data.';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error fetching students: $e';
        isLoading = false;
      });
    }
  }

  Future<void> openPdf(String pdfPath) async {
    final fileName = Uri.encodeComponent(pdfPath.split('/').last);
    final pdfUrl = '$baseUrl/Uploads/$fileName';
    final uri = Uri.parse(pdfUrl);

    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      setState(() {
        errorMessage = 'Could not open PDF: $pdfUrl';
      });
    }
  }

  Widget buildStudentCard(Map<String, dynamic> student) {
    final String photoFileName = student['student_photo'] ?? '';
    final String photoUrl =
        photoFileName.isNotEmpty ? '$baseUrl/uploads/$photoFileName' : '';
    final String teacherName = student['teacher_name'] ?? 'Not Available';

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ListTile(
            leading: CircleAvatar(
              backgroundImage: photoUrl.isNotEmpty
                  ? NetworkImage(photoUrl)
                  : const AssetImage('assets/images/student_default.png')
                      as ImageProvider,
              radius: 25,
              backgroundColor: Colors.grey[200],
            ),
            title: Text(student['student_name'] ?? 'Unnamed'),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                    '${student['assigned_class'] ?? 'N/A'} - ${student['assigned_section'] ?? 'N/A'}'),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(left: 16, bottom: 8),
            child: Text(
              'Your class teacher is $teacherName',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final String instituteName = studentData.isNotEmpty
        ? studentData[0]['institute_name'] ?? 'School Name Not Available'
        : '';

    return Scaffold(
      appBar: CustomAppBar(title: ''),
      drawer: Sidebar(
        userType: 'parent',
        userName:
            studentData.isNotEmpty ? studentData[0]['student_name'] : null,
        profileImageUrl: studentData.isNotEmpty
            ? '$baseUrl/uploads/${studentData[0]['student_photo']}'
            : null,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : errorMessage != null
              ? Center(
                  child: Text(
                    errorMessage!,
                    style: const TextStyle(color: Colors.red),
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    const Text(
                      "Your Children",
                      style:
                          TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                    ),
                    if (instituteName.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 8.0, bottom: 10.0),
                        child: Text(
                          'Welcome in $instituteName',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                    ...studentData.map(buildStudentCard),
                    const SizedBox(height: 20),
                    const NoticeWidget(),
                  ],
                ),
    );
  }
}
