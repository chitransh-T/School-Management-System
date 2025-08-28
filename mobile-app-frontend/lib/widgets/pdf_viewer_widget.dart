// pdf_viewer_widget.dart
import 'package:flutter/material.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';
import 'package:url_launcher/url_launcher.dart';

class PDFViewerScreen extends StatelessWidget {
  final String pdfData;
  final String baseUrl;
  final String title;
  final String label;

  const PDFViewerScreen({
    super.key,
    required this.pdfData,
    required this.baseUrl,
    required this.title,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // appBar: AppBar(title: Text(title)),
      appBar: CustomAppBar(title: title),
      body: _buildPDFViewer(context),
    );
  }

  Widget _buildPDFViewer(BuildContext context) {
    if (pdfData.isEmpty) {
      return Center(child: Text('No PDF available'));
    }

    final cleanPdfPath = pdfData.replaceAll('\\', '/').split('/').last;
    final cleanBaseUrl = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    final fullUrl = '$cleanBaseUrl/$cleanPdfPath';

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.picture_as_pdf, size: 64, color: Colors.red),
          SizedBox(height: 16),
          Text(label),
          SizedBox(height: 16),
          ElevatedButton.icon(
            icon: Icon(Icons.open_in_new),
            label: Text('View PDF'),
            onPressed: () async {
              try {
                final Uri url = Uri.parse(fullUrl);
                if (!await launchUrl(url,
                    mode: LaunchMode.externalApplication)) {
                  if (context.mounted) {
                    showCustomSnackBar(context,
                        'Could not open PDF. Please check if you have a PDF viewer installed.',
                        backgroundColor: Colors.red);
                  }
                }
              } catch (e) {
                if (context.mounted) {
                  showCustomSnackBar(context, 'Error opening PDF: $e',
                      backgroundColor: Colors.red);
                }
              }
            },
          ),
        ],
      ),
    );
  }
}
