import 'package:flutter/material.dart';

Future<bool> showDeleteTeacherDialog(
    BuildContext context, String teacherName) async {
  return await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Confirm Delete',
              style: TextStyle(
                  color: Colors.deepPurple[800], fontWeight: FontWeight.bold)),
          content: Text('Delete $teacherName permanently?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text('Cancel', style: TextStyle(color: Colors.grey[700])),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red[400],
                foregroundColor: Colors.white,
              ),
              onPressed: () => Navigator.pop(context, true),
              child: Text('Delete'),
            ),
          ],
        ),
      ) ??
      false;
}
