import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class SessionService {
  static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  static Future<Map<String, dynamic>> createSession({
    required String sessionName,
    required String startDate,
    required String endDate,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) {
        throw Exception('No token found. Please log in.');
      }

      final url = Uri.parse('$baseUrl/api/create');
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'session_name': sessionName,
          'start_date': startDate,
          'end_date': endDate,
        }),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Session created successfully',
          'data': responseData['data'],
        };
      } else if (response.statusCode == 400 &&
          responseData['activeSessionEndDate'] != null) {
        // Special case for active session error
        return {
          'success': false,
          'message': responseData['message'],
          'activeSessionEndDate': responseData['activeSessionEndDate'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Failed to create session',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  /// Fetch all sessions for the current school (based on token)
  static Future<Map<String, dynamic>> getSessions() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) {
        throw Exception('No token found. Please log in.');
      }

      final url =
          Uri.parse('$baseUrl/api/getsession'); // 👈 Make sure this is correct
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        return {
          'success': true,
          'data': responseData['data'], // List of sessions
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Failed to fetch sessions',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  /// 🔄 Update existing session
  static Future<Map<String, dynamic>> updateSession({
    required int id,
    required String sessionName,
    required String startDate,
    required String endDate,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) throw Exception('No token found. Please log in.');

      final url = Uri.parse('$baseUrl/api/updatesession');
      final response = await http.put(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'id': id,
          'session_name': sessionName,
          'start_date': startDate,
          'end_date': endDate,
        }),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Session updated successfully',
          'data': responseData['data'],
        };
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Failed to update session',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  static Future<Map<String, dynamic>> deleteSession(String sessionId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) {
        throw Exception('Token is not available.');
      }

      if (sessionId.isEmpty) {
        throw Exception('Session ID cannot be empty');
      }

      final url = '$baseUrl/api/session/$sessionId';

      final response = await http.delete(
        Uri.parse(url),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token,
        },
      );

      // Parse response JSON regardless of status code
      final Map<String, dynamic> responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        return responseData; // e.g. { success: true, message: "Session deleted" }
      } else {
        // Return error details from backend
        return responseData; // e.g. { success: false, message: "Please delete teachers first" }
      }
    } catch (error) {
      // Return generic error in similar format to keep consistent API
      return {
        'success': false,
        'message': error.toString(),
      };
    }
  }
}
