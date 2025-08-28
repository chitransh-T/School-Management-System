import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/models/student_model.dart';

// const String baseUrl = 'http://localhost:1000/api';
final String baseeUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

class StudentService {
  // Helper method to get the JWT token from shared_preferences
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token'); // Retrieve the token
  }

  // Fetch all students for the logged-in user
  Future<List<Student>> fetchStudents() async {
    final token = await _getToken(); // Get the token

    if (token == null) {
      throw Exception('No token found. Please log in.');
    }

    final response = await http.get(
      Uri.parse('$baseeUrl/api/students'),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': token, // Include the token in the header
      },
    );

    if (response.statusCode == 200) {
      List<dynamic> data = json.decode(response.body);
      return data.map((studentData) => Student.fromJson(studentData)).toList();
    } else {
      throw Exception('Failed to load students: ${response.statusCode}');
    }
  }

  // Update a student's details
  Future<void> updateStudent(
      Student student, Map<String, dynamic> updatedData) async {
    final token = await _getToken(); // Get the token

    if (token == null) {
      throw Exception('No token found. Please log in.');
    }

    try {
      // Create a multipart request for the update
      final request = http.MultipartRequest(
        'PUT',
        Uri.parse('$baseeUrl/api/students/${student.id}'),
      );

      // Add headers
      request.headers['Authorization'] =
          token; // Include the token in the header
      request.headers['Accept'] = 'application/json';

      // Add all text fields
      updatedData.forEach((key, value) {
        if (key != 'student_photo') {
          request.fields[key] = value.toString();
        }
      });

      // Add photo if it exists and is different from current photo
      if (updatedData['student_photo'] != null &&
          updatedData['student_photo'] != student.studentPhoto) {
        if (kIsWeb) {
          // For Web: Convert base64 to bytes and send as file
          final bytes = base64Decode(updatedData['student_photo']);
          request.files.add(
            http.MultipartFile.fromBytes(
              'student_photo',
              bytes,
              filename: 'student_photo.jpg',
            ),
          );
        } else {
          // For Mobile: Send file
          request.files.add(await http.MultipartFile.fromPath(
              'student_photo', updatedData['student_photo']));
        }
      } else {
        // Keep existing photo if no new photo is selected
        request.fields['student_photo'] = student.studentPhoto;
      }

      // print('Sending request to: ${request.url}');
      // print('Fields: ${request.fields}');
      // print('Files: ${request.files.length}');

      final response = await request.send();
      final responseBody = await response.stream.bytesToString();

      // print('Response status: ${response.statusCode}');
      // print('Response body: $responseBody');

      if (response.statusCode != 200) {
        throw Exception('Failed to update student: $responseBody');
      }
    } catch (e) {
      // print('Error updating student: $e');
      throw Exception('Failed to update student: $e');
    }
  }

  // Delete a student
  Future<void> deleteStudent(String studentId) async {
    final token = await _getToken(); // Get the token

    if (token == null) {
      throw Exception('No token found. Please log in.');
    }

    final response = await http.delete(
      Uri.parse('$baseeUrl/api/students/$studentId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token, // Include the token in the header
      },
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to delete student: ${response.statusCode}');
    }
  }
}
