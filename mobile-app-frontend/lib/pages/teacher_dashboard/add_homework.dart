import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:intl/intl.dart';
import 'package:file_picker/file_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/custom_appbar.dart';

class AddHomeworkPage extends StatefulWidget {
  const AddHomeworkPage({super.key});

  @override
  State<AddHomeworkPage> createState() => _AddHomeworkPageState();
}

class _AddHomeworkPageState extends State<AddHomeworkPage> {
  final _formKey = GlobalKey<FormState>();
  final _homeworkController = TextEditingController();

  DateTime startDate = DateTime.now();
  DateTime? endDate;
  bool isSubmitting = false;

  String error = '';
  String success = '';
  String? selectedClassKey; // Nullable String to store selected class key
  List<Map<String, dynamic>> availableClasses = [];

  Uint8List? pdfBytes; // Changed to Uint8List for web compatibility
  String? pdfFileName;

  static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  @override
  void initState() {
    super.initState();
    fetchClasses();
  }

  @override
  void dispose() {
    _homeworkController.dispose();
    super.dispose();
  }

  Future<void> fetchClasses() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/teachers/me'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      final data = json.decode(response.body);
      debugPrint('Teacher profile response (for classes): $data');

      if (response.statusCode == 200 && data['success'] == true) {
        final assigned = data['data']['assigned_classes'] as List<dynamic>?;

        if (assigned != null && assigned.isNotEmpty) {
          setState(() {
            availableClasses = assigned.map<Map<String, dynamic>>((cls) {
              final key = '${cls['class_name']} - ${cls['section']}';
              return {
                'key': key,
                'class_name': cls['class_name'],
                'section': cls['section'],
              };
            }).toList();

            selectedClassKey = availableClasses.first['key'] as String;
          });
        } else {
          setState(() => error = 'No classes assigned.');
        }
      } else {
        setState(() => error = 'Failed to load classes.');
      }
    } catch (e) {
      setState(() => error = 'Error fetching classes: $e');
    }
  }

  Future<void> pickPdfFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
      withData: true, // Important to get file bytes on web
    );

    if (result != null) {
      setState(() {
        pdfBytes = result.files.single.bytes;
        pdfFileName = result.files.single.name;
      });
    }
  }

  Future<void> submitHomework() async {
    if (!_formKey.currentState!.validate()) return;

    if (endDate == null || endDate!.isBefore(startDate)) {
      setState(() => error = 'Please select a valid end date.');
      return;
    }

    setState(() {
      isSubmitting = true;
      error = '';
      success = '';
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final selectedClass = availableClasses.firstWhere(
        (cls) => cls['key'] == selectedClassKey,
        orElse: () => {},
      );

      if (selectedClass.isEmpty) {
        setState(() {
          error = 'Selected class not found.';
          isSubmitting = false;
        });
        return;
      }

      final classIdToSend =
          selectedClass['class_name']; // Adjust if you get ID later

      var uri = Uri.parse('$baseUrl/api/homework');

      var request = http.MultipartRequest('POST', uri);
      request.headers['Authorization'] = 'Bearer $token';
      request.fields['class_id'] = classIdToSend;
      request.fields['homework'] = _homeworkController.text;
      request.fields['start_date'] = startDate.toIso8601String().split('T')[0];
      request.fields['end_date'] = endDate!.toIso8601String().split('T')[0];

      if (pdfBytes != null && pdfFileName != null) {
        request.files.add(http.MultipartFile.fromBytes(
          'homework_pdf',
          pdfBytes!,
          filename: pdfFileName,
          contentType: MediaType('application', 'pdf'),
        ));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      final resData = json.decode(response.body);
      debugPrint('Submit homework response: $resData');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        setState(() {
          success = 'Homework assigned successfully!';
          pdfBytes = null; // reset file on success
          pdfFileName = null;
          _homeworkController.clear();
          endDate = null;
        });
        Future.delayed(Duration(seconds: 2), () {
          if (!mounted) return;
          Navigator.pop(context, true);
        });
      } else {
        setState(
            () => error = resData['message'] ?? 'Failed to assign homework.');
      }
    } catch (e) {
      setState(() => error = 'Error submitting homework: $e');
    } finally {
      setState(() => isSubmitting = false);
    }
  }

  Future<void> pickDate({required bool isEndDate}) async {
    final DateTime today = DateTime.now();
    final DateTime initial = isEndDate
        ? (endDate ?? startDate)
        : (startDate.isBefore(today) ? today : startDate);

    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: isEndDate
          ? startDate.isBefore(today)
              ? today
              : startDate // end date can't be before start
          : today, // start date can't be in the past
      lastDate: DateTime(2100),
    );

    if (picked != null) {
      setState(() {
        if (isEndDate) {
          endDate = picked;
        } else {
          startDate = picked;
          // Clear endDate if it's now invalid
          if (endDate != null && endDate!.isBefore(picked)) {
            endDate = null;
          }
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(title: 'Assign Homework'),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: availableClasses.isEmpty
            ? Center(child: CircularProgressIndicator())
            : Form(
                key: _formKey,
                child: ListView(
                  children: [
                    if (error.isNotEmpty) _buildStatusCard(error, true),
                    if (success.isNotEmpty) _buildStatusCard(success, false),
                    DropdownButtonFormField<String>(
                      value: selectedClassKey,
                      items:
                          availableClasses.map<DropdownMenuItem<String>>((cls) {
                        return DropdownMenuItem<String>(
                          value: cls['key'] as String,
                          child: Text(cls['key'] as String),
                        );
                      }).toList(),
                      decoration: InputDecoration(
                        labelText: 'Select Class',
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (val) =>
                          setState(() => selectedClassKey = val),
                      validator: (val) => val == null || val.isEmpty
                          ? 'Class is required'
                          : null,
                    ),
                    SizedBox(height: 16),
                    ListTile(
                      title: Text(
                          'Start Date: ${DateFormat.yMMMd().format(startDate)}'),
                      trailing: Icon(Icons.calendar_today),
                      onTap: () => pickDate(isEndDate: false),
                    ),
                    Divider(),
                    ListTile(
                      title: Text(endDate == null
                          ? 'Select End Date'
                          : 'End Date: ${DateFormat.yMMMd().format(endDate!)}'),
                      trailing: Icon(Icons.calendar_today),
                      onTap: () => pickDate(isEndDate: true),
                    ),
                    SizedBox(height: 16),
                    TextFormField(
                      controller: _homeworkController,
                      maxLines: 5,
                      decoration: InputDecoration(
                        labelText: 'Homework Details',
                        border: OutlineInputBorder(),
                      ),
                      validator: (val) => val == null || val.isEmpty
                          ? 'Details are required'
                          : null,
                    ),
                    SizedBox(height: 20),

                    // PDF Upload UI
                    Text(
                      'Upload PDF (optional)',
                      style:
                          TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            pdfFileName ?? 'No file selected',
                            style: TextStyle(color: Colors.grey[700]),
                          ),
                        ),
                        ElevatedButton(
                          onPressed: pickPdfFile,
                          child: Text('Choose File'),
                        ),
                      ],
                    ),

                    SizedBox(height: 20),
                    CustomButton(
                      text: isSubmitting ? 'Assigning...' : 'Assign Homework',
                      onPressed: isSubmitting ? null : submitHomework,
                      icon: Icons.save_alt,
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildStatusCard(String message, bool isError) {
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isError ? Colors.red.shade100 : Colors.green.shade100,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(
            isError ? Icons.error : Icons.check_circle,
            color: isError ? Colors.red : Colors.green,
          ),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: isError ? Colors.red.shade800 : Colors.green.shade800,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
