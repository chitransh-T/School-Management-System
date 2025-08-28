import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'api_base.dart';

class AuthService {
  static final String apiUrlRegister = '${ApiBase.baseUrl}/api/auth/register';
  static final String apiUrlLogin = '${ApiBase.baseUrl}/api/auth/login';

  static Future<bool> register(
    String email,
    String phone,
    String password,
    String confirmpassword,
    String selectedRole, {
    required String schoolId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(apiUrlRegister),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'phone': phone,
          'password': password,
          'confirmpassword': confirmpassword,
          'role': selectedRole,
          'school_id': schoolId,
        }),
      );

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        return responseData['success'] ?? false;
      } else {
        debugPrint(
            'Registration failed with status code: ${response.statusCode}');
        return false;
      }
    } catch (error) {
      debugPrint('Error: $error');
      return false;
    }
  }

  static Future<Map<String, dynamic>> login(
      String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse(apiUrlLogin),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': username, 'password': password}),
      );

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          final token = responseData['token'];
          final decodedToken = _decodeJwt(token);

          return {
            'success': true,
            'token': token,
            'role': responseData['role'],
            'user_email': decodedToken['user_email'] ?? decodedToken['email'],
            'user_id': decodedToken['user_id'],
          };
        }
      }

      if (!username.contains('@')) {
        final studentResponse = await _attemptStudentLogin(username, password);
        if (studentResponse['success'] == true) {
          final token = studentResponse['token'];
          final decodedToken = _decodeJwt(token);

          return {
            'success': true,
            'token': token,
            'role': studentResponse['role'],
            'user_email': decodedToken['user_email'] ?? decodedToken['email'],
            'user_id': decodedToken['user_id'],
          };
        }
      }

      return {
        'success': false,
        'message': 'Invalid username/email or password'
      };
    } catch (error) {
      return {'success': false, 'message': 'Something went wrong'};
    }
  }

  static Map<String, dynamic> _decodeJwt(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) throw Exception('Invalid token');

      final payload = parts[1];
      final normalized = base64Url.normalize(payload);
      final decoded = utf8.decode(base64Url.decode(normalized));

      return jsonDecode(decoded);
    } catch (e) {
      return {};
    }
  }

  static Future<Map<String, dynamic>> _attemptStudentLogin(
      String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse(apiUrlLogin),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'password': password}),
      );

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          return {
            'success': true,
            'token': responseData['token'],
            'role': responseData['role'],
          };
        }
      }
      return {'success': false};
    } catch (e) {
      return {'success': false};
    }
  }
}
