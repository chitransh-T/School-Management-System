import 'package:flutter/material.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'student_registration_controller.dart';
import 'student_registration_form.dart';

class StudentRegistrationPage extends StatefulWidget {
  final void Function() onStudentRegistered;

  const StudentRegistrationPage({super.key, required this.onStudentRegistered});

  @override
  State<StudentRegistrationPage> createState() =>
      _StudentRegistrationPageState();
}

class _StudentRegistrationPageState extends State<StudentRegistrationPage> {
  final _controller = StudentRegistrationController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(
        title: 'New Student Registration',
      ),
      body: StudentRegistrationForm(
        controller: _controller,
        onRegistered: widget.onStudentRegistered,
      ),
    );
  }
}
