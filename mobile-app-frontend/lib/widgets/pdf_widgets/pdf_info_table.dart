import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class InfoTable extends StatelessWidget {
  final List<Map<String, dynamic>> rows;
  final BuildContext context;

  const InfoTable({
    super.key,
    required this.rows,
    required this.context,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(color: Colors.purple[100]!),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Table(
          border: TableBorder.all(
            color: Colors.deepPurple[100]!,
            borderRadius: BorderRadius.circular(12),
          ),
          columnWidths: const {
            0: FlexColumnWidth(1.2),
            1: FlexColumnWidth(2),
          },
          children: rows.asMap().entries.map((entry) {
            final index = entry.key;
            final row = entry.value;
            final isHeader = row['isHeader'] ?? false;
            final text = row['text'] as String;
            final value = row['value'] as String;
            final status = row['status'] as bool? ?? false;
            final copyEnabled = row['copyEnabled'] as bool? ?? false;
            final isPassword = row['isPassword'] as bool? ?? false;

            return TableRow(
              decoration: BoxDecoration(
                color: isHeader ? Colors.deepPurple[50] : Colors.white,
                borderRadius: index == 0
                    ? const BorderRadius.only(
                        topLeft: Radius.circular(12),
                        topRight: Radius.circular(12),
                      )
                    : index == rows.length - 1
                        ? const BorderRadius.only(
                            bottomLeft: Radius.circular(12),
                            bottomRight: Radius.circular(12),
                          )
                        : null,
              ),
              children: [
                _buildTableCell(text, isHeader, context: context),
                _buildTableCell(
                  isPassword ? '••••••••' : value,
                  false,
                  context: context,
                  status: status,
                  copyEnabled: copyEnabled,
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildTableCell(
    String text,
    bool isHeader, {
    required BuildContext context,
    bool copyEnabled = false,
    bool status = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isHeader ? Colors.deepPurple[50] : Colors.white,
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontWeight: isHeader ? FontWeight.bold : FontWeight.normal,
                color:
                    isHeader ? Colors.deepPurple[900] : Colors.deepPurple[800],
              ),
            ),
          ),
          if (status)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.green[100],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'Active',
                style: TextStyle(
                  color: Colors.green[800],
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          if (copyEnabled)
            IconButton(
              icon: Icon(Icons.copy, size: 16, color: Colors.deepPurple[800]),
              onPressed: () {
                Clipboard.setData(ClipboardData(text: text));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: const Text('Copied to clipboard'),
                    backgroundColor: Colors.deepPurple[800],
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    duration: const Duration(seconds: 1),
                  ),
                );
              },
              tooltip: 'Copy to clipboard',
            ),
        ],
      ),
    );
  }
}
