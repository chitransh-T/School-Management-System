import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class FeeMasterService {
  static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  static Future<Map<String, dynamic>> submitFeeFields(
      List<Map<String, dynamic>> feeFields) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) {
        return {'success': false, 'message': 'Unauthorized: No token found'};
      }

      final response = await http.post(
        Uri.parse('$baseUrl/api/createfee'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'fee_fields': feeFields}),
      );

      final json = jsonDecode(response.body);

      return {
        'success': response.statusCode == 200,
        'message': json['message'] ?? 'Something went wrong',
      };
    } catch (e) {
      debugPrint('Error submitting fees: $e');
      return {
        'success': false,
        'message': 'Network error. Please try again.',
      };
    }
  }

  static Future<List<Map<String, dynamic>>> getFeeFields() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) return [];

      final response = await http.get(
        Uri.parse('$baseUrl/api/getfee'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success']) {
          return List<Map<String, dynamic>>.from(data['data']);
        }
      }

      return [];
    } catch (e) {
      debugPrint('Error fetching fee fields: $e');
      return [];
    }
  }
}
