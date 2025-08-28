import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class FeeStructureService {
  static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  static Future<FeeStructureResponse> submitFeeStructure({
    required String classId,
    required List<Map<String, dynamic>> structure,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) {
        return FeeStructureResponse(success: false, message: 'No token found');
      }

      final numericClassId = int.tryParse(classId);
      if (numericClassId == null) {
        return FeeStructureResponse(
            success: false, message: 'Invalid class ID');
      }

      final requestBody = {
        'class_id': numericClassId,
        'structure': structure,
      };

      final response = await http.post(
        Uri.parse('$baseUrl/api/registerfee'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(requestBody),
      );

      final responseBody = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return FeeStructureResponse(
            success: true, message: responseBody['message'] ?? 'Success');
      } else {
        return FeeStructureResponse(
            success: false,
            message: responseBody['message'] ??
                'Failed with status code ${response.statusCode}');
      }
    } catch (e) {
      return FeeStructureResponse(success: false, message: e.toString());
    }
  }

  static Future<List<Map<String, dynamic>>> getFeeStructure(
      String classId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) {
        debugPrint('No token found');
        return [];
      }

      final response = await http.get(
        Uri.parse('$baseUrl/api/feestructure/$classId'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final List rawData = body['data'];

        return List<Map<String, dynamic>>.from(rawData.map((item) => {
              'fee_field_name': item['fee_field_name'],
              'amount': item['amount'],
              'is_collectable': item['is_collectable'],
            }));
      } else {
        debugPrint(
            'Failed to load fee structure: ${response.statusCode} - ${response.body}');
        return [];
      }
    } catch (e) {
      debugPrint('Error fetching fee structure: $e');
      return [];
    }
  }
}

class FeeStructureResponse {
  final bool success;
  final String message;

  FeeStructureResponse({required this.success, required this.message});
}
