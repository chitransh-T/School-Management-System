import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
// import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
// import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/pages/services/profile_service.dart';

class PdfUtils {
  static Future<String?> fetchInstituteName() async {
    try {
      final profile = await ProfileService.getProfile();
      return profile['data']?['institute_name'] ?? 'ALMANET SCHOOL';
    } catch (e) {
      debugPrint('Error fetching institute name: $e');
      return 'ALMANET SCHOOL';
    }
  }

  static Future<String?> fetchLogoUrl() async {
    try {
      final baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';
      final profile = await ProfileService.getProfile();
      final logoUrl = profile['data']?['logo_url'] ?? '';

      if (logoUrl.isEmpty) return null;

      final cleanBaseUrl = baseUrl.endsWith('/')
          ? baseUrl.substring(0, baseUrl.length - 1)
          : baseUrl;
      final cleanLogoUrl = logoUrl.startsWith('/') ? logoUrl : '/$logoUrl';

      return logoUrl.startsWith('http') ? logoUrl : cleanBaseUrl + cleanLogoUrl;
    } catch (e) {
      debugPrint('Error fetching logo URL: $e');
      return null;
    }
  }

  static Future<pw.MemoryImage?> fetchImage(String url) async {
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        return pw.MemoryImage(response.bodyBytes);
      }
    } catch (e) {
      debugPrint('Failed to load image: $e');
    }
    return null;
  }
}
