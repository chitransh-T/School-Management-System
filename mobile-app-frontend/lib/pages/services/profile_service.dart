import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ProfileService {
  static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  // Save profile - no userEmail param
  static Future<Map<String, dynamic>> saveProfile({
    required String instituteName,
    required String address,
    required dynamic logo, // File or Uint8List
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) {
        throw Exception('No token found. Please log in.');
      }

      final uri = Uri.parse('$baseUrl/api/profile');
      var request = http.MultipartRequest('POST', uri);

      request.headers['Authorization'] = 'Bearer $token';

      request.fields['institute_name'] = instituteName;
      request.fields['address'] = address;

      if (logo is File) {
        var stream = http.ByteStream(logo.openRead());
        var length = await logo.length();
        var multipartFile = http.MultipartFile(
          'logo',
          stream,
          length,
          filename: logo.path.split('/').last,
        );
        request.files.add(multipartFile);
      } else if (logo is Uint8List) {
        var multipartFile = http.MultipartFile.fromBytes(
          'logo',
          logo,
          filename: 'logo.jpg',
        );
        request.files.add(multipartFile);
      }

      final response = await request.send();
      final responseBody = await response.stream.bytesToString();

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final jsonResponse = jsonDecode(responseBody);
        return {
          'success': true,
          'message': jsonResponse['message'] ?? 'Profile saved successfully',
          'data': jsonResponse['data'],
        };
      } else {
        final errorResponse = jsonDecode(responseBody);
        throw Exception(errorResponse['message'] ?? 'Failed to save profile');
      }
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  // Get profile - no userEmail param, just fetch based on token
  static Future<Map<String, dynamic>> getProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) {
        throw Exception('No token found. Please log in.');
      }

      final url = Uri.parse('$baseUrl/api/profile');
      final response = await http.get(
        url,
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);
        return {
          'success': true,
          'data': jsonData['data'],
        };
      } else if (response.statusCode == 404) {
        return {
          'success': true,
          'data': {
            'institute_name': '',
            'address': '',
            'logo': null,
          },
        };
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to fetch profile');
      }
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }
}
