import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/pdf_viewer_widget.dart'; // Import your PDF viewer

class ViewTeacherHomeworkPage extends StatefulWidget {
  const ViewTeacherHomeworkPage({super.key});

  @override
  State<ViewTeacherHomeworkPage> createState() =>
      _ViewTeacherHomeworkPageState();
}

class _ViewTeacherHomeworkPageState extends State<ViewTeacherHomeworkPage> {
  bool isLoading = true;
  String error = '';
  List<dynamic> homeworkList = [];
  static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  @override
  void initState() {
    super.initState();
    fetchHomework();
  }

  Future<void> fetchHomework() async {
    setState(() {
      isLoading = true;
      error = '';
    });

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/gethomework'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        setState(() {
          homeworkList = data['data'];
        });
      } else {
        setState(() {
          error = data['message'] ?? 'Failed to fetch homework.';
        });
      }
    } catch (e) {
      setState(() {
        error = 'Error fetching homework: $e';
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> _deleteHomework(int homeworkId) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    setState(() {
      isLoading = true;
      error = '';
    });

    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/deletehomework/$homeworkId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        setState(() {
          homeworkList.removeWhere((hw) => hw['id'] == homeworkId);
        });
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Homework deleted successfully')),
        );
      } else {
        setState(() {
          error = data['message'] ?? 'Failed to delete homework.';
        });
      }
    } catch (e) {
      setState(() {
        error = 'Error deleting homework: $e';
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> _confirmDelete(int homeworkId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Homework'),
        content: const Text('Are you sure you want to delete this homework?'),
        actions: [
          TextButton(
            child: const Text('Cancel'),
            onPressed: () => Navigator.of(context).pop(false),
          ),
          TextButton(
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
            onPressed: () => Navigator.of(context).pop(true),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      _deleteHomework(homeworkId);
    }
  }

  Future<void> _openPdf(String pdfFilePath) async {
    final fileName = pdfFilePath.split('/').last;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PDFViewerScreen(
          pdfData: fileName,
          baseUrl: '$baseUrl/uploads',
          title: 'Homework PDF',
          label: 'Tap the button below to view the PDF',
        ),
      ),
    );
  }

  Widget _buildHomeworkItem(dynamic hw) {
    final startDate = hw['start_date'] != null
        ? DateTime.parse(hw['start_date']).toLocal()
        : DateTime.now();
    final endDate = hw['end_date'] != null
        ? DateTime.parse(hw['end_date']).toLocal()
        : DateTime.now();

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      child: ListTile(
        title: Text('${hw['class_id']}'),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(hw['homework'] ?? ''),
            const SizedBox(height: 8),
            Text(
              'From: ${DateFormat.yMMMd().format(startDate)}  To: ${DateFormat.yMMMd().format(endDate)}',
              style: TextStyle(fontSize: 12, color: Colors.grey[700]),
            ),
            if (hw['pdf_file_path'] != null &&
                hw['pdf_file_path'].toString().isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: InkWell(
                  onTap: () => _openPdf(hw['pdf_file_path']),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.picture_as_pdf, color: Colors.blue),
                      SizedBox(width: 6),
                      Text(
                        'View PDF',
                        style: TextStyle(
                          color: Colors.blue,
                          decoration: TextDecoration.underline,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
        isThreeLine: true,
        trailing: IconButton(
          icon: const Icon(Icons.delete, color: Colors.red),
          onPressed: () => _confirmDelete(hw['id']),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(title: "My Assigned Homework"),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : error.isNotEmpty
              ? Center(
                  child: Text(error, style: const TextStyle(color: Colors.red)))
              : homeworkList.isEmpty
                  ? const Center(child: Text('No homework assigned yet.'))
                  : RefreshIndicator(
                      onRefresh: fetchHomework,
                      child: ListView.builder(
                        itemCount: homeworkList.length,
                        itemBuilder: (context, index) {
                          final hw = homeworkList[index];
                          return _buildHomeworkItem(hw);
                        },
                      ),
                    ),
    );
  }
}
