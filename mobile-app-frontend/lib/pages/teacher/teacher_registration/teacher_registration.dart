import 'package:flutter/material.dart';
import 'package:sms/pages/teacher/teacher_registration/teacher_registration_form.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'teacher_registration_controller.dart';

class TeacherRegistrationPage extends StatefulWidget {
  final void Function() onTeacherRegistered;

  const TeacherRegistrationPage({super.key, required this.onTeacherRegistered});

  @override
  State<TeacherRegistrationPage> createState() =>
      _TeacherRegistrationPageState();
}

class _TeacherRegistrationPageState extends State<TeacherRegistrationPage> {
  final _controller = TeacherRegistrationController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(title: 'New Teacher Registration'),
      body: Container(
        color: Colors.grey.shade100,
        child: TeacherRegistrationForm(
          controller: _controller,
          onRegistered: widget.onTeacherRegistered,
        ),
      ),
    );
  }
}
