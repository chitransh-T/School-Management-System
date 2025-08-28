import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // <-- Import for inputFormatters
import '../teacher_registration_controller.dart';

class TeacherAdvance extends StatefulWidget {
  final TeacherRegistrationController controller;

  const TeacherAdvance({super.key, required this.controller});

  @override
  State<TeacherAdvance> createState() => _TeacherAdvanceState();
}

class _TeacherAdvanceState extends State<TeacherAdvance> {
  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(color: Colors.deepPurple.shade100, width: 1),
      ),
      child: ExpansionTile(
        initiallyExpanded: true,
        collapsedBackgroundColor: Colors.deepPurple.shade50,
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        title: const Text(
          "DETAIL INFORMATION",
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.deepPurple,
            fontSize: 16,
          ),
        ),
        childrenPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: [
          const SizedBox(height: 8),
          _buildFormField(
            controller: widget.controller.guardianController,
            label: 'Father/Husband Name',
            icon: Icons.family_restroom,
            isRequired: true,
          ),
          const SizedBox(height: 16),
          _buildFormField(
            controller: widget.controller.teacherqualificationController,
            label: 'Qualification',
            icon: Icons.school_outlined,
            isRequired: true,
          ),
          const SizedBox(height: 16),
          _buildFormField(
            controller: widget.controller.teacherexperienceController,
            label: 'Experience',
            icon: Icons.work_outline,
            isRequired: true,
          ),
          const SizedBox(height: 16),
          _buildFormField(
            controller: widget.controller.teachersalaryController,
            label: 'Salary',
            icon: Icons.attach_money_outlined,
            isRequired: true,
            keyboardType: TextInputType.number,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly, // Allow digits only
            ],
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter salary';
              }
              final int? salary = int.tryParse(value);
              if (salary == null) {
                return 'Salary must be a valid number';
              }
              if (salary <= 0) {
                return 'Salary must be greater than 0';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildFormField(
            controller: widget.controller.addressController,
            label: 'Address',
            icon: Icons.home_outlined,
            isRequired: true,
            maxLines: 2,
          ),
          const SizedBox(height: 16),
          _buildFormField(
            controller: widget.controller.phoneController,
            label: 'Phone',
            icon: Icons.phone_outlined,
            isRequired: true,
            keyboardType: TextInputType.phone,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter phone number';
              }
              if (value.length != 10) {
                return 'Phone number must be 10 digits';
              }
              return null;
            },
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildFormField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool isRequired = false,
    String? Function(String?)? validator,
    int? maxLines,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines ?? 1,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      decoration: InputDecoration(
        labelText: isRequired ? '$label*' : label,
        labelStyle: TextStyle(color: Colors.deepPurple.shade700),
        prefixIcon: Icon(icon, color: Colors.deepPurple.shade600),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        enabledBorder: OutlineInputBorder(
          borderSide: BorderSide(color: Colors.deepPurple.shade300),
          borderRadius: BorderRadius.circular(8),
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: Colors.deepPurple.shade700, width: 2),
          borderRadius: BorderRadius.circular(8),
        ),
      ),
      validator: validator ??
          (isRequired
              ? (value) => value!.isEmpty ? 'Please enter $label' : null
              : null),
    );
  }
}
