import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AttendanceService {
  static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  // Shared method for handling unauthorized responses
  static Future<void> handleUnauthorized() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  // Shared method for saving attendance (both student and teacher)
  static Future<Map<String, dynamic>> saveAttendance({
    required String token,
    required DateTime date,
    List<Map<String, dynamic>>? students,
    List<Map<String, dynamic>>? teachers,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/attendance'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: json.encode({
          'date': DateFormat('yyyy-MM-dd').format(date),
          if (students != null) 'students': students,
          if (teachers != null) 'teachers': teachers,
        }),
      );

      final Map<String, dynamic> body = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': body['message'] ?? 'Attendance saved successfully'
        };
      } else if (response.statusCode == 409) {
        return {
          'success': false,
          'message': body['message'] ?? 'Attendance already exists'
        };
      } else if (response.statusCode == 401) {
        await handleUnauthorized();
        return {
          'success': false,
          'message': 'Session expired. Please login again.'
        };
      } else {
        return {
          'success': false,
          'message': body['message'] ??
              response.reasonPhrase ??
              'Failed to save attendance'
        };
      }
    } catch (error) {
      return {'success': false, 'message': 'Error saving attendance: $error'};
    }
  }
}
