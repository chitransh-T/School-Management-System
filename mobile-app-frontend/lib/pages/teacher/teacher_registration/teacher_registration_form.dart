import 'package:flutter/material.dart';
import 'package:sms/pages/teacher/teacher_registration/teacher_form/teacher_advance.dart';
import 'package:sms/pages/teacher/teacher_registration/teacher_form/teacher_document.dart';
import 'package:sms/widgets/button.dart';
import 'teacher_registration_controller.dart';
import 'teacher_form/teacher_info.dart';

class TeacherRegistrationForm extends StatefulWidget {
  final TeacherRegistrationController controller;
  final void Function() onRegistered;

  const TeacherRegistrationForm({
    super.key,
    required this.controller,
    required this.onRegistered,
  });

  @override
  State<TeacherRegistrationForm> createState() =>
      _TeacherRegistrationFormState();
}

class _TeacherRegistrationFormState extends State<TeacherRegistrationForm> {
  late TeacherRegistrationController _controller;
  final _scrollController = ScrollController();

  bool _isLoading = false; // Local loading state

  @override
  void initState() {
    super.initState();
    _controller = widget.controller;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Form(
            key: _controller.formKey,
            child: Scrollbar(
              controller: _scrollController,
              child: ListView(
                controller: _scrollController,
                children: [
                  // Header with mandatory fields note
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.deepPurple.shade50,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.info_outline,
                            color: Colors.deepPurple, size: 18),
                        SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            "Fields marked with an asterisk (*) are mandatory",
                            style: TextStyle(
                              color: Colors.deepPurple,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Teacher Information Section
                  _buildSectionHeader("Teacher Information"),
                  const SizedBox(height: 16),
                  TeacherInfo(controller: _controller),
                  const SizedBox(height: 24),

                  // Advance Information Section
                  _buildSectionHeader("Advance Information"),
                  const SizedBox(height: 16),
                  TeacherAdvance(controller: _controller),
                  const SizedBox(height: 24),

                  // Documents Section
                  _buildSectionHeader("Documents"),
                  const SizedBox(height: 16),
                  TeacherDocument(controller: _controller),
                  const SizedBox(height: 32),

                  // Register Button with local loading state
                  CustomButton(
                    text: 'Register Teacher',
                    icon: Icons.person_add,
                    isLoading: _isLoading,
                    width: 40,
                    onPressed: _isLoading
                        ? null
                        : () async {
                            _controller.showConfirmationDialog(context,
                                () async {
                              setState(() => _isLoading = true);

                              bool success =
                                  await _controller.registerteacher(context);

                              setState(() => _isLoading = false);

                              if (success) {
                                widget.onRegistered();
                                if (context.mounted) {
                                  Navigator.pop(context);
                                }
                              }
                            });
                          },
                  ),

                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Row(
      children: [
        Container(
          height: 24,
          width: 4,
          decoration: BoxDecoration(
            color: Colors.deepPurple.shade700,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Colors.deepPurple.shade800,
          ),
        ),
      ],
    );
  }
}
