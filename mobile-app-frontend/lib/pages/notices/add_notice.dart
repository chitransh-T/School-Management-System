import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/custom_appbar.dart';

class AddNoticePage extends StatefulWidget {
  const AddNoticePage({super.key});

  @override
  State<AddNoticePage> createState() => _AddNoticePageState();
}

class _AddNoticePageState extends State<AddNoticePage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();

  String title = '';
  String content = '';
  String category = '';
  String priority = 'medium';
  DateTime selectedDate = DateTime.now();
  DateTime? endDate;

  bool isSubmitting = false;
  String error = '';
  String success = '';
  static final String baseeUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  Future<void> submitNotice() async {
    if (!_formKey.currentState!.validate()) return;

    // Optional validation for endDate
    if (endDate == null) {
      setState(() => error = 'Please select a valid end date.');
      return;
    }

    // Ensure endDate is not before selectedDate
    if (endDate!.isBefore(selectedDate)) {
      setState(() => error = 'End date cannot be before notice date.');
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

      if (token == null) {
        setState(() => error = 'You must be logged in to create a notice.');
        return;
      }

      final body = {
        'title': title,
        'content': content,
        'category': category,
        'priority': priority,
        'notice_date': selectedDate.toIso8601String().split('T')[0],
        'end_date': endDate!.toIso8601String().split('T')[0],
      };

      final response = await http.post(
        Uri.parse('$baseeUrl/api/notices'),
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: json.encode(body),
      );

      final resData = json.decode(response.body);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception(resData['error'] ?? 'Failed to create notice.');
      }

      setState(() {
        success = 'Notice created successfully!';
      });

      Future.delayed(Duration(seconds: 2), () {
        if (!mounted) return;
        Navigator.pop(context, true); // Return true to indicate success
      });
    } catch (e) {
      setState(() => error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      setState(() => isSubmitting = false);
    }
  }

  Future<void> pickDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: selectedDate,
      firstDate: DateTime(2023),
      lastDate: DateTime(2100),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Theme.of(context).primaryColor,
              onPrimary: Colors.white,
              onSurface: Colors.black,
            ),
            textButtonTheme: TextButtonThemeData(
              style: TextButton.styleFrom(
                foregroundColor: Theme.of(context).primaryColor,
              ),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != selectedDate) {
      setState(() {
        selectedDate = picked;
        // Reset endDate if it is before new selectedDate
        if (endDate != null && endDate!.isBefore(picked)) {
          endDate = null;
        }
      });
    }
  }

  Future<void> pickEndDate() async {
    final DateTime firstAllowedDate =
        selectedDate.isAfter(DateTime.now()) ? selectedDate : DateTime.now();

    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: endDate ?? firstAllowedDate,
      firstDate: firstAllowedDate,
      lastDate: DateTime(2100),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Theme.of(context).primaryColor,
              onPrimary: Colors.white,
              onSurface: Colors.black,
            ),
            textButtonTheme: TextButtonThemeData(
              style: TextButton.styleFrom(
                foregroundColor: Theme.of(context).primaryColor,
              ),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => endDate = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDarkMode = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: CustomAppBar(
        title: 'Create New Notice',
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20.0),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(height: 16),

                // Status Messages
                if (error.isNotEmpty)
                  _buildStatusCard(
                    context,
                    message: error,
                    isError: true,
                  ),
                if (success.isNotEmpty)
                  _buildStatusCard(
                    context,
                    message: success,
                    isError: false,
                  ),

                SizedBox(height: 16),

                // Title Field
                Text(
                  'Notice Title',
                  style: theme.textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w500,
                    color: isDarkMode ? Colors.white70 : Colors.black87,
                  ),
                ),
                SizedBox(height: 8),
                TextFormField(
                  controller: _titleController,
                  decoration: InputDecoration(
                    hintText: 'Enter notice title',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    filled: true,
                    fillColor: isDarkMode ? Colors.grey[800] : Colors.grey[100],
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                  style: theme.textTheme.bodyLarge,
                  onChanged: (val) => setState(() => title = val),
                  validator: (val) =>
                      val == null || val.isEmpty ? 'Title is required' : null,
                ),

                SizedBox(height: 20),

                // Content Field
                Text(
                  'Notice Content',
                  style: theme.textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w500,
                    color: isDarkMode ? Colors.white70 : Colors.black87,
                  ),
                ),
                SizedBox(height: 8),
                TextFormField(
                  controller: _contentController,
                  decoration: InputDecoration(
                    hintText: 'Enter notice details',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    filled: true,
                    fillColor: isDarkMode ? Colors.grey[800] : Colors.grey[100],
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                  maxLines: 5,
                  style: theme.textTheme.bodyLarge,
                  onChanged: (val) => setState(() => content = val),
                  validator: (val) =>
                      val == null || val.isEmpty ? 'Content is required' : null,
                ),

                SizedBox(height: 20),

                // Notice Date Picker
                Text(
                  'Notice Date',
                  style: theme.textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w500,
                    color: isDarkMode ? Colors.white70 : Colors.black87,
                  ),
                ),
                SizedBox(height: 8),
                InkWell(
                  onTap: pickDate,
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                    decoration: BoxDecoration(
                      border: Border.all(color: theme.dividerColor),
                      borderRadius: BorderRadius.circular(10),
                      color: isDarkMode ? Colors.grey[800] : Colors.grey[100],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          DateFormat('MMMM dd, yyyy').format(selectedDate),
                          style: theme.textTheme.bodyLarge,
                        ),
                        Icon(Icons.calendar_today, size: 20),
                      ],
                    ),
                  ),
                ),

                SizedBox(height: 20),

                // Notice End Date Picker
                Text(
                  'Notice End Date',
                  style: theme.textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w500,
                    color: isDarkMode ? Colors.white70 : Colors.black87,
                  ),
                ),
                SizedBox(height: 8),
                InkWell(
                  onTap: pickEndDate,
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                    decoration: BoxDecoration(
                      border: Border.all(color: theme.dividerColor),
                      borderRadius: BorderRadius.circular(10),
                      color: isDarkMode ? Colors.grey[800] : Colors.grey[100],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          endDate != null
                              ? DateFormat('MMMM dd, yyyy').format(endDate!)
                              : 'Select end date',
                          style: theme.textTheme.bodyLarge,
                        ),
                        Icon(Icons.calendar_today, size: 20),
                      ],
                    ),
                  ),
                ),

                SizedBox(height: 20),

                // Category Dropdown
                Text(
                  'Category',
                  style: theme.textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w500,
                    color: isDarkMode ? Colors.white70 : Colors.black87,
                  ),
                ),
                SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  decoration: InputDecoration(
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    filled: true,
                    fillColor: isDarkMode ? Colors.grey[800] : Colors.grey[100],
                  ),
                  items: <String>[
                    'General',
                    'Events',
                    'Alerts',
                    'Updates',
                    'Others',
                  ].map((category) {
                    return DropdownMenuItem<String>(
                      value: category,
                      child: Text(category),
                    );
                  }).toList(),
                  onChanged: (val) => setState(() => category = val ?? ''),
                  validator: (val) => val == null || val.isEmpty
                      ? 'Category is required'
                      : null,
                  value: category.isEmpty ? null : category,
                ),

                SizedBox(height: 20),

                // Priority Radio Buttons
                Text(
                  'Priority',
                  style: theme.textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w500,
                    color: isDarkMode ? Colors.white70 : Colors.black87,
                  ),
                ),
                SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildPriorityRadio('low'),
                    _buildPriorityRadio('medium'),
                    _buildPriorityRadio('high'),
                  ],
                ),

                SizedBox(height: 30),

                CustomButton(
                  text: 'Submit Notice',
                  onPressed: submitNotice,
                  isLoading: isSubmitting,
                  icon: Icons.send,
                  height: 50,
                ),

                SizedBox(height: 30),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPriorityRadio(String value) {
    final theme = Theme.of(context);
    final isDarkMode = theme.brightness == Brightness.dark;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Radio<String>(
          value: value,
          groupValue: priority,
          onChanged: (val) => setState(() => priority = val ?? 'medium'),
          activeColor: Colors.blue.shade900,
        ),
        Text(
          value[0].toUpperCase() + value.substring(1),
          style: theme.textTheme.bodyLarge?.copyWith(
            color: isDarkMode ? Colors.white70 : Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusCard(BuildContext context,
      {required String message, required bool isError}) {
    final theme = Theme.of(context);
    return Container(
      margin: EdgeInsets.symmetric(vertical: 8),
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isError ? Colors.red.shade100 : Colors.green.shade100,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(
            isError ? Icons.error_outline : Icons.check_circle_outline,
            color: isError ? Colors.red : Colors.green,
          ),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: isError ? Colors.red.shade800 : Colors.green.shade800,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
