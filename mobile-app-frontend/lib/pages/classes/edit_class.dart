import 'package:flutter/material.dart';
import 'package:sms/pages/services/class_service.dart';
import 'package:sms/widgets/button.dart'; // Your custom button
import 'package:sms/pages/classes/all_class.dart'; // For Class and Teacher models

class EditClassPage extends StatefulWidget {
  final Class classItem;
  final List<Teacher> teachers;

  const EditClassPage({
    super.key,
    required this.classItem,
    required this.teachers,
  });

  @override
  State<EditClassPage> createState() => _EditClassPageState();
}

class _EditClassPageState extends State<EditClassPage> {
  late String? _selectedTeacherId;
  String? _errorMessage; // Holds inline error message

  @override
  void initState() {
    super.initState();

    final matchedTeacher = widget.teachers.firstWhere(
      (teacher) => teacher.id == widget.classItem.teacherId,
      orElse: () => Teacher(id: '', name: ''),
    );

    _selectedTeacherId =
        matchedTeacher.id.isNotEmpty ? matchedTeacher.id : null;
  }

  Future<void> _saveChanges() async {
    if (_selectedTeacherId == null) {
      setState(() {
        _errorMessage = 'Please select a teacher';
      });
      return;
    }

    try {
      final success = await ClassService.updateClass(
        classId: widget.classItem.id,
        className: widget.classItem.className,
        teacherId: _selectedTeacherId!,
      );

      if (!mounted) return;
      if (success) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title:
          Text('Edit Class', style: TextStyle(color: Colors.deepPurple[900])),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildReadOnlyField('Class Name', widget.classItem.className),
            SizedBox(height: 12),
            _buildReadOnlyField('Section', widget.classItem.section),
            SizedBox(height: 12),

            // Inline error message box (only show if error message is not null)
            if (_errorMessage != null)
              Container(
                width: double.infinity,
                margin: EdgeInsets.only(bottom: 12),
                padding: EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.red[100],
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  _errorMessage!,
                  style: TextStyle(
                    color: Colors.red[900],
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),

            DropdownButtonFormField<String>(
              value: _selectedTeacherId,
              items: widget.teachers
                  .map(
                    (teacher) => DropdownMenuItem<String>(
                      value: teacher.id,
                      child: Text(teacher.name),
                    ),
                  )
                  .toList(),
              onChanged: (value) => setState(() {
                _selectedTeacherId = value;
                _errorMessage = null; // Clear error on user interaction
              }),
              decoration: InputDecoration(
                labelText: 'Class Teacher',
                labelStyle: TextStyle(color: Colors.deepPurple[900]),
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child:
              Text('Cancel', style: TextStyle(color: Colors.deepPurple[900])),
        ),
        CustomButton(
          text: 'Save',
          onPressed: _saveChanges,
          icon: Icons.save_alt,
        ),
      ],
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    );
  }

  Widget _buildReadOnlyField(String label, String value) {
    return TextFormField(
      initialValue: value,
      enabled: false,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.deepPurple[900]),
        disabledBorder: OutlineInputBorder(
          borderSide: BorderSide(color: Colors.grey),
        ),
        filled: true,
        fillColor: Colors.grey[100],
      ),
      style: TextStyle(color: Colors.grey[700]),
    );
  }
}
