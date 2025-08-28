import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

class PdfHeader {
  static pw.Widget build({
    required String instituteName,
    pw.MemoryImage? logoImage,
    String subtitle = 'Excellence in Education',
    double logoSize = 60,
  }) {
    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(vertical: 16),
      width: double.infinity,
      decoration: pw.BoxDecoration(
        color: PdfColors.purple50,
        borderRadius: pw.BorderRadius.circular(12),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.center,
        children: [
          // Logo or placeholder
          logoImage != null
              ? pw.ClipOval(
                  child: pw.Image(
                    logoImage,
                    width: logoSize,
                    height: logoSize,
                    fit: pw.BoxFit.cover,
                  ),
                )
              : pw.Container(
                  width: logoSize,
                  height: logoSize,
                  decoration: const pw.BoxDecoration(
                    shape: pw.BoxShape.circle,
                    color: PdfColors.purple200,
                  ),
                  child: pw.Center(
                    child: pw.Text(
                      'AS',
                      style: pw.TextStyle(
                        fontSize: logoSize * 0.33,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColors.purple900,
                      ),
                    ),
                  ),
                ),

          pw.SizedBox(height: 8),

          // Institute name
          pw.Text(
            instituteName,
            style: pw.TextStyle(
              fontSize: 24,
              fontWeight: pw.FontWeight.bold,
              color: PdfColors.purple900,
            ),
          ),

          // Optional subtitle
          if (subtitle.isNotEmpty) ...[
            pw.SizedBox(height: 4),
            pw.Text(
              subtitle,
              style: const pw.TextStyle(
                fontSize: 14,
                color: PdfColors.purple900,
              ),
            ),
          ]
        ],
      ),
    );
  }
}
