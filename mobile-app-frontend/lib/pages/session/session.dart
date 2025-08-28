import 'package:flutter/material.dart';
import 'package:sms/pages/services/session_service.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';
import 'package:sms/widgets/date_picker.dart';

class CreateSessionPage extends StatefulWidget {
  const CreateSessionPage({super.key});

  @override
  State<CreateSessionPage> createState() => _CreateSessionPageState();
}

class _CreateSessionPageState extends State<CreateSessionPage> {
  final TextEditingController sessionNameController = TextEditingController();
  DateTime? startDate;
  DateTime? endDate;
  bool isLoading = false;

  // Future<void> createSession() async {
  //   if (startDate == null || endDate == null) {
  //     ScaffoldMessenger.of(context).showSnackBar(
  //       SnackBar(
  //         content: Text('Please select both start and end dates'),
  //         backgroundColor: Colors.red,
  //       ),
  //     );
  //     return;
  //   }

  //   setState(() {
  //     isLoading = true;
  //   });

  //   final result = await SessionService.createSession(
  //     sessionName: sessionNameController.text.trim(),
  //     startDate: startDate!.toIso8601String().split('T').first,
  //     endDate: endDate!.toIso8601String().split('T').first,
  //   );

  //   setState(() {
  //     isLoading = false;
  //   });
  //   if (!mounted) return;
  //   ScaffoldMessenger.of(context).showSnackBar(
  //     SnackBar(
  //       content: Text(result['message'] ?? 'Unknown error'),
  //       backgroundColor: result['success'] == true ? Colors.green : Colors.red,
  //     ),
  //   );

  //   if (result['success'] == true) {
  //     sessionNameController.clear();
  //     setState(() {
  //       startDate = null;
  //       endDate = null;
  //     });
  //   }
  // }

  Future<void> createSession() async {
    if (startDate == null || endDate == null) {
      showCustomSnackBar(
        context,
        'Please select both start and end dates',
        backgroundColor: Colors.red,
      );
      return;
    }

    if (sessionNameController.text.trim().isEmpty) {
      showCustomSnackBar(
        context,
        'Please enter a session name',
        backgroundColor: Colors.red,
      );
      return;
    }

    setState(() {
      isLoading = true;
    });

    final result = await SessionService.createSession(
      sessionName: sessionNameController.text.trim(),
      startDate: startDate!.toIso8601String().split('T').first,
      endDate: endDate!.toIso8601String().split('T').first,
    );

    setState(() {
      isLoading = false;
    });

    if (!mounted) return;

    if (result['success'] == true) {
      showCustomSnackBar(
        context,
        result['message'] ?? 'Session created successfully',
        backgroundColor: Colors.green,
      );

      sessionNameController.clear();
      setState(() {
        startDate = null;
        endDate = null;
      });
    } else {
      showCustomSnackBar(
        context,
        result['message'] ?? 'Unknown error',
        backgroundColor: Colors.red,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(), // dismiss keyboard
      child: Scaffold(
        appBar: const CustomAppBar(title: 'Create Session'),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: 500),
              child: Card(
                elevation: 4,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Text(
                        'New Academic Session',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.deepPurple.shade700,
                        ),
                      ),
                      const SizedBox(height: 24),

                      /// Session Name Field
                      TextFormField(
                        controller: sessionNameController,
                        decoration: InputDecoration(
                          labelText: 'Session Name*',
                          prefixIcon: Icon(Icons.edit_calendar,
                              color: Colors.deepPurple.shade600),
                          labelStyle:
                              TextStyle(color: Colors.deepPurple.shade700),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8)),
                          enabledBorder: OutlineInputBorder(
                            borderSide:
                                BorderSide(color: Colors.deepPurple.shade300),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderSide: BorderSide(
                                color: Colors.deepPurple.shade700, width: 2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      /// Start Date Picker
                      CustomDatePicker(
                        selectedDate: startDate ?? DateTime.now(),
                        onDateSelected: (DateTime newDate) {
                          setState(() {
                            startDate = newDate;
                            // Reset end date if it's before start date
                            if (endDate != null && endDate!.isBefore(newDate)) {
                              endDate = null;
                            }
                          });
                        },
                        labelText: 'Start Date',
                        isExpanded: true,
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.deepPurple.shade700,
                        padding:
                            EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        firstDate: DateTime(2000),
                        lastDate: DateTime(2100),
                      ),
                      const SizedBox(height: 16),

                      /// End Date Picker
                      CustomDatePicker(
                        selectedDate: endDate ?? DateTime.now(),
                        onDateSelected: (DateTime newDate) {
                          setState(() {
                            endDate = newDate;
                          });
                        },
                        labelText: 'End Date',
                        isExpanded: true,
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.deepPurple.shade700,
                        padding:
                            EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        firstDate: startDate ?? DateTime(2000),
                        lastDate: DateTime(2100),
                      ),
                      const SizedBox(height: 30),

                      /// Submit Button
                      isLoading
                          ? CircularProgressIndicator()
                          : CustomButton(
                              text: 'Create Session',
                              onPressed: createSession,
                              isLoading: isLoading,
                              icon: Icons.save_alt,
                              width: 200,
                              height: 50,
                            ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
