import 'package:flutter/material.dart';
import 'package:sms/pages/services/session_service.dart';
import 'package:intl/intl.dart'; // For date formatting
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/date_picker.dart'; // Import the custom date picker
import 'package:sms/models/session_model.dart';

class EditSessionDialog extends StatefulWidget {
  final Session session;

  const EditSessionDialog({super.key, required this.session});

  @override
  State<EditSessionDialog> createState() => _EditSessionDialogState();
}

class _EditSessionDialogState extends State<EditSessionDialog> {
  late TextEditingController _sessionNameController;
  late DateTime _startDate;
  late DateTime _endDate;

  @override
  void initState() {
    super.initState();
    _sessionNameController =
        TextEditingController(text: widget.session.sessionName);
    _startDate = DateTime.tryParse(widget.session.startDate) ?? DateTime.now();
    _endDate = DateTime.tryParse(widget.session.endDate) ?? DateTime.now();
  }

  @override
  void dispose() {
    _sessionNameController.dispose();
    super.dispose();
  }

  Future<void> _updateSession() async {
    final DateFormat dateFormat = DateFormat('yyyy-MM-dd');

    final result = await SessionService.updateSession(
      id: widget.session.id,
      sessionName: _sessionNameController.text,
      startDate: dateFormat.format(_startDate),
      endDate: dateFormat.format(_endDate),
    );

    if (result['success'] == true) {
      if (!mounted) return;
      Navigator.pop(context, true); // return true on success
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Failed to update session'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title:
          Text('Edit Session', style: TextStyle(color: Colors.deepPurple[900])),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _sessionNameController,
              decoration: InputDecoration(
                labelText: 'Session Name',
                border: OutlineInputBorder(),
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
            ),
            SizedBox(height: 16),
            CustomDatePicker(
              selectedDate: _startDate,
              onDateSelected: (DateTime newDate) {
                setState(() {
                  _startDate = newDate;
                  // Ensure end date is not before start date
                  if (_endDate.isBefore(_startDate)) {
                    _endDate = _startDate;
                  }
                });
              },
              labelText: 'Start Date',
              isExpanded: true,
              backgroundColor: Colors.white,
              foregroundColor: Colors.deepPurple[900],
              padding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              firstDate: DateTime(2000),
              lastDate: DateTime(2100),
            ),
            SizedBox(height: 16),
            CustomDatePicker(
              selectedDate: _endDate,
              onDateSelected: (DateTime newDate) {
                setState(() {
                  _endDate = newDate;
                });
              },
              labelText: 'End Date',
              isExpanded: true,
              backgroundColor: Colors.white,
              foregroundColor: Colors.deepPurple[900],
              padding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              firstDate: _startDate, // Can't be before start date
              lastDate: DateTime(2100),
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
          onPressed: _updateSession,
          isLoading: false,
          icon: Icons.save_alt,
          height: 45,
          width: 120,
        ),
      ],
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    );
  }
}
