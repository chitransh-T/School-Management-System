import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_base.dart';

class ClassService {
  static final String apiUrlRegisterClass = '${ApiBase.baseUrl}/api/classes';

  static Future<bool> registerClass({
    required String className,
    required String section,
    required String teacherId,
  }) async {
    try {
      final headers = await ApiBase.getHeaders();

      final response = await http.post(
        Uri.parse(apiUrlRegisterClass),
        headers: headers,
        body: json.encode({
          'class_name': className,
          'section': section,
          'teacher_id': teacherId,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return true;
      } else {
        final errorData = json.decode(response.body);
        final errorMessage =
            errorData['message'] ?? 'Failed to register class'; // ✅ FIXED KEY
        throw Exception(errorMessage);
      }
    } catch (e) {
      rethrow;
    }
  }

  static Future<List<Map<String, dynamic>>> fetchClasses() async {
    try {
      final headers = await ApiBase.getHeaders();

      final response = await http.get(
        Uri.parse('${ApiBase.baseUrl}/api/classes'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        List<dynamic> data = json.decode(response.body);
        return data
            .map((classData) => classData as Map<String, dynamic>)
            .toList();
      } else {
        throw Exception('Failed to load classes: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching classes: $e');
    }
  }

  static Future<bool> updateClass({
    required String classId,
    required String className,
    required String teacherId,
  }) async {
    try {
      final headers = await ApiBase.getHeaders();

      final response = await http.put(
        Uri.parse('${ApiBase.baseUrl}/api/classes/$classId'),
        headers: headers,
        body: json.encode({
          'class_name': className,
          'teacher_id': teacherId,
        }),
      );

      if (response.statusCode == 200) {
        return true;
      } else {
        // 🔥 Extract the actual error message from the backend
        final body = json.decode(response.body);
        final errorMessage = body['message'] ?? 'Unknown error occurred';

        throw Exception(errorMessage);
      }
    } catch (error) {
      rethrow; // Pass the error message up
    }
  }

  static Future<bool> deleteClass(String classId) async {
    try {
      final headers = await ApiBase.getHeaders();

      final response = await http.delete(
        Uri.parse('${ApiBase.baseUrl}/api/classes/$classId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return true;
      } else {
        throw Exception('Delete failed with status: ${response.statusCode}');
      }
    } catch (error) {
      rethrow;
    }
  }

  static Future<List<Map<String, dynamic>>>
      modelgetStudentCountByClass() async {
    try {
      final headers = await ApiBase.getHeaders();

      final response = await http.get(
        Uri.parse('${ApiBase.baseUrl}/api/api/students/count-by-class'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        if (responseData is Map && responseData['data'] is List) {
          return (responseData['data'] as List).cast<Map<String, dynamic>>();
        }
        return [];
      } else {
        throw Exception('Failed to fetch counts: ${response.statusCode}');
      }
    } catch (e) {
      return [];
    }
  }

  static Future<int> getClassCount() async {
    try {
      final headers = await ApiBase.getHeaders();

      final response = await http.get(
        Uri.parse('${ApiBase.baseUrl}/api/classes/count'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        return responseData['totalClasses'] ?? 0;
      } else {
        throw Exception('Failed to load class count: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching class count: $e');
    }
  }
}
