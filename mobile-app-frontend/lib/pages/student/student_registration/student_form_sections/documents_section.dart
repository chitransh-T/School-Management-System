import 'package:flutter/material.dart';
import '../student_registration_controller.dart';

class DocumentsSection extends StatefulWidget {
  final StudentRegistrationController controller;

  const DocumentsSection({super.key, required this.controller});

  @override
  State<DocumentsSection> createState() => _DocumentsSectionState();
}

class _DocumentsSectionState extends State<DocumentsSection> {
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
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        title: const Text(
          "DOCUMENTS",
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.deepPurple,
            fontSize: 16,
          ),
        ),
        childrenPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: [
          _buildDocumentRow(
            label: 'Birth Certificate',
            onPressed: () async {
              await widget.controller.pickFile(context, false);
              setState(() {});
            },
            fileName: widget.controller.birthCertificateName,
            isRequired: true,
          ),
          const SizedBox(height: 16),
          _buildDocumentRow(
            label: 'Student Photo',
            onPressed: () async {
              await widget.controller.pickFile(context, true);
              setState(() {});
            },
            fileName: widget.controller.studentPhotoName,
            isRequired: true,
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildDocumentRow({
    required String label,
    required VoidCallback onPressed,
    String? fileName,
    bool isRequired = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                isRequired ? '$label*' : label,
                style: TextStyle(
                  color: Colors.deepPurple.shade800,
                  fontSize: 14,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: onPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.deepPurple.shade50,
                foregroundColor: Colors.deepPurple.shade800,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                  side: BorderSide(color: Colors.deepPurple.shade300),
                ),
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              ),
              child: const Text('Upload'),
            ),
          ],
        ),
        if (fileName != null && fileName.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 4.0, left: 8.0),
            child: Text(
              'Selected: $fileName',
              style: TextStyle(
                fontSize: 12,
                color: Colors.deepPurple.shade600,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
      ],
    );
  }
}
