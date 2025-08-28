import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_base.dart';

class SubjectService {
  static final String apiUrlRegisterSubject =
      '${ApiBase.baseUrl}/api/registersubject';
  // static final String apiUrlDeleteSubjectsByClass =
  //     '${ApiBase.baseUrl}/api/delete-by-class';
  static final String apiUrlDeleteSubject =
      '${ApiBase.baseUrl}/api/deletesubject';
  static final String apiUrlUpdateSubject =
      '${ApiBase.baseUrl}/api/updatesubject';
  static final String apiUrlGetSubject =
      '${ApiBase.baseUrl}/api/getallsubjects';

  static Future<bool> registerSubject({
    required int classId,
    required List<Map<String, dynamic>> subjectsData,
  }) async {
    try {
      final headers = await ApiBase.getHeaders();

      final response = await http.post(
        Uri.parse(apiUrlRegisterSubject),
        headers: headers,
        body: json.encode({
          'class_id': classId,
          'subjects': subjectsData,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return true;
      } else if (response.statusCode == 409) {
        final errorMsg =
            jsonDecode(response.body)['message'] ?? 'Conflict error';
        throw Exception(errorMsg);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to register subject');
      }
    } catch (e) {
      rethrow;
    }
  }

  static Future<List<dynamic>> fetchClassesWithSubjects() async {
    try {
      final headers = await ApiBase.getHeaders();

      final response = await http.get(
        Uri.parse(apiUrlGetSubject),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseBody = json.decode(response.body);
        final data = responseBody['data'];
        if (data is List) {
          return data;
        } else {
          throw Exception('Invalid data format');
        }
      } else {
        final errorData = json.decode(response.body);
        throw Exception(
          errorData['message'] ?? 'Failed to load classes with subjects',
        );
      }
    } catch (e) {
      rethrow;
    }
  }

  static Future<bool> updateSubjects({
    required String classId,
    required List<Map<String, dynamic>> subjectsData,
  }) async {
    try {
      final headers = await ApiBase.getHeaders();

      final response = await http.put(
        Uri.parse(apiUrlUpdateSubject),
        headers: headers,
        body: json.encode({
          'class_id': classId,
          'subjects': subjectsData,
        }),
      );

      if (response.statusCode == 200) {
        return true;
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to update subjects');
      }
    } catch (e) {
      rethrow;
    }
  }

  static Future<bool> deleteSingleSubject(String subjectId) async {
    try {
      final headers = await ApiBase.getHeaders();

      final response = await http.delete(
        Uri.parse('$apiUrlDeleteSubject/$subjectId'), // already exists!
        headers: headers,
      );

      if (response.statusCode == 200) {
        return true;
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to delete subject');
      }
    } catch (e) {
      rethrow;
    }
  }
}
