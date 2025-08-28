import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class TeacherAssignApiService {
  static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  static Future<List<dynamic>> fetchTeacherAssignments(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/teacher-assignments'),
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    } else {
      throw Exception('Failed to load teacher assignments');
    }
  }

  static Future<List<dynamic>> fetchClassTeachers(
      String token, int classId, String section) async {
    final response = await http.get(
      Uri.parse('$baseUrl/class-teachers/$classId/$section'),
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    } else {
      throw Exception('Failed to load class teachers');
    }
  }

  static Future<dynamic> assignTeacher({
    required String token,
    required String teacherId,
    required int classId,
    required String section,
    required List<String> subjectIds,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/assign-teacher'),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'teacher_id': teacherId,
        'class_id': classId,
        'section': section,
        'subject_ids': subjectIds,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to assign teacher');
    }
  }
}
