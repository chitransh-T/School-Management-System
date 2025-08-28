import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/models/teacher_model.dart';

final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

class TeacherService {
  // Get token from shared preferences
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  /// ---------------------------
  /// Register a new teacher
  /// ---------------------------
  static Future<bool> registerTeacher({
    required String teacherName,
    required String email,
    required String password,
    required String dob,
    required String doj,
    required String gender,
    required String guardianName,
    required String qualification,
    required String experience,
    required String salary,
    required String address,
    required String phone,
    required dynamic teacherPhoto, // File or Uint8List
    required dynamic qualificationCertificate, // File or Uint8List
  }) async {
    try {
      final token = await _getToken();
      if (token == null) throw Exception('No token found. Please log in.');

      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/api/registerteacher'),
      );

      request.headers['Authorization'] = token;

      request.fields['teacher_name'] = teacherName;
      request.fields['email'] = email;
      request.fields['password'] = password;
      request.fields['date_of_birth'] = dob;
      request.fields['date_of_joining'] = doj;
      request.fields['gender'] = gender;
      request.fields['guardian_name'] = guardianName;
      request.fields['qualification'] = qualification;
      request.fields['experience'] = experience;
      request.fields['salary'] = salary;
      request.fields['address'] = address;
      request.fields['phone'] = phone;

      if (teacherPhoto != null) {
        if (teacherPhoto is File) {
          var stream = http.ByteStream(teacherPhoto.openRead());
          var length = await teacherPhoto.length();
          request.files.add(http.MultipartFile(
            'teacher_photo',
            stream,
            length,
            filename: teacherPhoto.path.split('/').last,
          ));
        } else if (teacherPhoto is Uint8List) {
          request.files.add(http.MultipartFile.fromBytes(
            'teacher_photo',
            teacherPhoto,
            filename: 'teacher_photo.jpg',
          ));
        }
      }

      if (qualificationCertificate != null) {
        if (qualificationCertificate is File) {
          var stream = http.ByteStream(qualificationCertificate.openRead());
          var length = await qualificationCertificate.length();
          request.files.add(http.MultipartFile(
            'qualification_certificate',
            stream,
            length,
            filename: qualificationCertificate.path.split('/').last,
          ));
        } else if (qualificationCertificate is Uint8List) {
          request.files.add(http.MultipartFile.fromBytes(
            'qualification_certificate',
            qualificationCertificate,
            filename: 'qualification_certificate.pdf',
          ));
        }
      }

      var response = await request.send();
      return response.statusCode == 200;
    } catch (e) {
      rethrow;
    }
  }

  /// ---------------------------
  /// Fetch all teachers
  /// ---------------------------
  static Future<List<Teacher>> fetchTeachers() async {
    final token = await _getToken();
    if (token == null) throw Exception('No token found. Please log in.');

    final response = await http.get(
      Uri.parse('$baseUrl/api/teachers'),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      List<dynamic> data = json.decode(response.body);
      return data.map((t) => Teacher.fromJson(t)).toList();
    } else {
      throw Exception('Failed to load teachers: ${response.statusCode}');
    }
  }

  /// ---------------------------
  /// Update a teacher's details
  /// ---------------------------
  static Future<void> updateTeacher(
    Teacher teacher,
    Map<String, dynamic> updatedData,
  ) async {
    final token = await _getToken();
    if (token == null) throw Exception('No token found. Please log in.');

    try {
      final request = http.MultipartRequest(
        'PUT',
        Uri.parse('$baseUrl/api/teachers/${teacher.id}'),
      );

      request.headers['Authorization'] = token;
      request.headers['Accept'] = 'application/json';

      updatedData.forEach((key, value) {
        if (key != 'teacher_photo') {
          request.fields[key] = value.toString();
        }
      });

      if (updatedData['teacher_photo'] != null &&
          updatedData['teacher_photo'] != teacher.teacherPhoto) {
        if (kIsWeb) {
          final bytes = base64Decode(updatedData['teacher_photo']);
          request.files.add(http.MultipartFile.fromBytes(
            'teacher_photo',
            bytes,
            filename: 'teacher_photo.jpg',
          ));
        } else {
          request.files.add(await http.MultipartFile.fromPath(
              'teacher_photo', updatedData['teacher_photo']));
        }
      } else {
        request.fields['teacher_photo'] = teacher.teacherPhoto;
      }

      final response = await request.send();
      final responseBody = await response.stream.bytesToString();

      if (response.statusCode != 200) {
        throw Exception('Failed to update teacher: $responseBody');
      }
    } catch (e) {
      throw Exception('Failed to update teacher: $e');
    }
  }

  static Future<String?> deleteTeacher(String teacherId) async {
    final token = await _getToken();
    if (token == null) return 'No token found. Please log in.';

    final response = await http.delete(
      Uri.parse('$baseUrl/api/teachers/$teacherId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    );

    if (response.statusCode == 200) {
      return null; // ✅ success
    } else {
      try {
        final body = jsonDecode(response.body);
        return body['message'] ?? body['error'] ?? 'Failed to delete teacher';
      } catch (_) {
        return 'Failed to delete teacher (status ${response.statusCode})';
      }
    }
  }
}
