import 'package:flutter/material.dart';

// Common card for attendance filters/controls
class AttendanceFilterCard extends StatelessWidget {
  final Widget child;

  const AttendanceFilterCard({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: child,
      ),
    );
  }
}

// Common list item for attendance records
class AttendanceListItem extends StatelessWidget {
  final String id;
  final String name;
  final String? subtitle;
  final bool isPresent;
  final ValueChanged<bool>? onChanged;

  const AttendanceListItem({
    super.key,
    required this.id,
    required this.name,
    this.subtitle,
    required this.isPresent,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
      ),
      child: ListTile(
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: Colors.deepPurple.shade100,
          child: Text(
            name.substring(0, 1),
            style: TextStyle(color: Colors.deepPurple.shade800),
          ),
        ),
        title: Text(
          name,
          style: TextStyle(
              fontWeight: FontWeight.w500, color: Colors.deepPurple.shade900),
        ),
        subtitle: subtitle != null
            ? Text(
                subtitle!,
                style: TextStyle(color: Colors.grey[600]),
              )
            : null,
        trailing: onChanged != null
            ? Transform.scale(
                scale: 1.2,
                child: Switch(
                  value: isPresent,
                  onChanged: onChanged,
                  activeColor: Colors.deepPurple,
                  activeTrackColor: Colors.deepPurple.shade200,
                ),
              )
            : null,
      ),
    );
  }
}
