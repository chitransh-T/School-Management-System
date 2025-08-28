import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

class PdfSignature {
  static pw.Widget build({bool compact = false}) {
    return pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.center,
          children: [
            pw.Container(
              width: 80,
              height: 1,
              color: PdfColors.black,
            ),
            pw.SizedBox(height: compact ? 2 : 4),
            pw.Text(
              'Principal Signature',
              style: pw.TextStyle(fontSize: compact ? 7 : 8),
            ),
          ],
        ),
        pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.center,
          children: [
            pw.Container(
              width: 80,
              height: 1,
              color: PdfColors.black,
            ),
            pw.SizedBox(height: compact ? 2 : 4),
            pw.Text(
              'School Stamp',
              style: pw.TextStyle(fontSize: compact ? 7 : 8),
            ),
          ],
        ),
      ],
    );
  }
}
