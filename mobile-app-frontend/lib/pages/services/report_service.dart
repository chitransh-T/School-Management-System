import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ReportService {
  static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  // Shared method for handling unauthorized responses
  static Future<void> handleUnauthorized() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  // Shared method for fetching reports
  static Future<Map<String, dynamic>> fetchReport({
    required String token,
    required String endpoint,
    required DateTime date,
    String? classId,
    String? section,
  }) async {
    try {
      final formattedDate = DateFormat('yyyy-MM-dd').format(date);
      Uri uri;

      if (classId != null && section != null) {
        final encodedSection = Uri.encodeComponent(section);
        uri = Uri.parse(
            '$baseUrl/api/$endpoint/$classId/$encodedSection/$formattedDate');
      } else {
        uri = Uri.parse('$baseUrl/api/$endpoint/$formattedDate');
      }

      final response = await http.get(
        uri,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token,
        },
      );

      final Map<String, dynamic> body = json.decode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': body,
          'exists': (body['students'] ?? body['teachers'] ?? []).isNotEmpty,
        };
      } else if (response.statusCode == 401) {
        await handleUnauthorized();
        return {
          'success': false,
          'message': 'Session expired. Please login again.',
          'unauthorized': true,
        };
      } else if (response.statusCode == 404) {
        return {
          'success': true,
          'data': null,
          'exists': false,
        };
      } else {
        return {
          'success': false,
          'message': body['message'] ??
              'Failed to load report: ${response.reasonPhrase}',
        };
      }
    } catch (error) {
      return {
        'success': false,
        'message': 'Error connecting to server: $error',
      };
    }
  }
}
