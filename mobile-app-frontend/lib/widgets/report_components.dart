import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

// Common card for report filters
class ReportFilterCard extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const ReportFilterCard({
    super.key,
    required this.title,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.deepPurple[800],
              ),
            ),
            SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }
}

// Common attendance list item
class AttendanceListItem extends StatelessWidget {
  final String name;
  final String? subtitle;
  final bool isPresent;

  const AttendanceListItem({
    super.key,
    required this.name,
    this.subtitle,
    required this.isPresent,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(name, style: TextStyle(color: Colors.deepPurple[900])),
      subtitle: subtitle != null ? Text(subtitle!) : null,
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isPresent ? Icons.check_circle : Icons.cancel,
            color: isPresent ? Colors.green : Colors.red,
          ),
          SizedBox(width: 8),
          Text(
            isPresent ? 'Present' : 'Absent',
            style: TextStyle(
              color: isPresent ? Colors.green : Colors.red,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

// Common attendance summary widget
class AttendanceSummary extends StatelessWidget {
  final int presentCount;
  final int absentCount;
  final int totalCount;

  const AttendanceSummary({
    super.key,
    required this.presentCount,
    required this.absentCount,
    required this.totalCount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          Expanded(
            child: Text(
              'Present: $presentCount',
              style: _summaryTextStyle(Colors.green),
              textAlign: TextAlign.center,
            ),
          ),
          Expanded(
            child: Text(
              'Absent: $absentCount',
              style: _summaryTextStyle(Colors.red),
              textAlign: TextAlign.center,
            ),
          ),
          Expanded(
            child: Text(
              'Total: $totalCount',
              style: _summaryTextStyle(Colors.deepPurple[800]!),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  TextStyle _summaryTextStyle(Color color) {
    return TextStyle(
      color: color,
      fontWeight: FontWeight.bold,
      fontSize: 14,
    );
  }
}

// Common header for attendance lists
class AttendanceListHeader extends StatelessWidget {
  final String title;
  final DateTime date;

  const AttendanceListHeader({
    super.key,
    required this.title,
    required this.date,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.deepPurple[800],
              ),
            ),
          ),
          Text(
            DateFormat.yMMMMd().format(date),
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.deepPurple[800],
            ),
          ),
        ],
      ),
    );
  }
}

// Common list header row
class AttendanceListHeaderRow extends StatelessWidget {
  final String leftText;
  final String rightText;

  const AttendanceListHeaderRow({
    super.key,
    required this.leftText,
    required this.rightText,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.deepPurple[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            leftText,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.deepPurple[800],
            ),
          ),
          Text(
            rightText,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.deepPurple[800],
            ),
          ),
        ],
      ),
    );
  }
}
