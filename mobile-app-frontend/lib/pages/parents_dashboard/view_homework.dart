import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/pdf_viewer_widget.dart'; // Import the PDF viewer widget

class ViewHomeworkPage extends StatefulWidget {
  const ViewHomeworkPage({super.key});

  @override
  State<ViewHomeworkPage> createState() => _ViewHomeworkPageState();
}

class _ViewHomeworkPageState extends State<ViewHomeworkPage> {
  bool isLoading = true;
  String? errorMessage;
  List<Map<String, dynamic>> homeworkData = [];
  final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  @override
  void initState() {
    super.initState();
    fetchHomework();
  }

  Future<void> fetchHomework() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) {
      setState(() {
        errorMessage = 'Token missing. Please login again.';
        isLoading = false;
      });
      return;
    }

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/gethomeworkforparent'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          homeworkData = List<Map<String, dynamic>>.from(data);
          isLoading = false;
        });
        // print("✅ Homework data fetched: $homeworkData");
      } else {
        setState(() {
          errorMessage = 'Failed to load homework data.';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error fetching homework: $e';
        isLoading = false;
      });
    }
  }

  void openPdf(String pdfPath) {
    final fileName = pdfPath.split('/').last;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PDFViewerScreen(
          pdfData: fileName,
          baseUrl: '$baseUrl/Uploads',
          title: 'Homework PDF',
          label: 'Tap the button below to view the PDF',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: 'Homework'),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : errorMessage != null
              ? Center(
                  child: Text(
                    errorMessage!,
                    style: const TextStyle(color: Colors.red),
                  ),
                )
              : homeworkData.isEmpty
                  ? const Center(
                      child: Text("No homework assigned."),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: homeworkData.length,
                      itemBuilder: (context, index) {
                        final hw = homeworkData[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 16),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Subject: ${hw['subject_name'] ?? 'N/A'}',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 18,
                                      color: Colors.deepPurple),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  hw['homework'] ?? 'N/A',
                                  style: const TextStyle(fontSize: 16),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'From: ${hw['start_date']?.toString().split("T")[0]}  To: ${hw['end_date']?.toString().split("T")[0]}',
                                  style: const TextStyle(
                                      fontSize: 13, color: Colors.grey),
                                ),
                                if (hw['pdf_file_path'] != null &&
                                    hw['pdf_file_path'].isNotEmpty)
                                  TextButton(
                                    onPressed: () =>
                                        openPdf(hw['pdf_file_path']),
                                    child: const Text(
                                      '📄 View PDF',
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: Colors.blueAccent,
                                        decoration: TextDecoration.underline,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}
