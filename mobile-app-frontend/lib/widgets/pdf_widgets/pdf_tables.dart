import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

class PdfTables {
  static pw.TableRow buildHeaderRow(
    List<String> cells, {
    double fontSize = 10,
  }) {
    return pw.TableRow(
      decoration: const pw.BoxDecoration(color: PdfColors.deepPurple50),
      children: cells.map((cell) {
        return pw.Container(
          padding: const pw.EdgeInsets.symmetric(vertical: 4, horizontal: 6),
          child: pw.Text(
            cell,
            style: pw.TextStyle(
              fontSize: fontSize,
              fontWeight: pw.FontWeight.bold,
              color: PdfColors.deepPurple800,
            ),
          ),
        );
      }).toList(),
    );
  }

  static pw.TableRow buildRow(
    List<String> cells, {
    double fontSize = 10,
    PdfColor? valueColor,
  }) {
    return pw.TableRow(
      children: cells.asMap().entries.map((entry) {
        final index = entry.key;
        final cell = entry.value;
        return pw.Container(
          padding: const pw.EdgeInsets.symmetric(vertical: 4, horizontal: 6),
          child: pw.Text(
            cell,
            style: pw.TextStyle(
              fontSize: fontSize,
              color: index == 1 && valueColor != null
                  ? valueColor
                  : PdfColors.deepPurple800,
            ),
          ),
        );
      }).toList(),
    );
  }

  static pw.TableRow buildStatusRow(
    String field,
    String value, {
    double fontSize = 10,
  }) {
    return pw.TableRow(
      children: [
        pw.Container(
          padding: const pw.EdgeInsets.symmetric(vertical: 4, horizontal: 6),
          child: pw.Text(
            field,
            style: pw.TextStyle(
              fontSize: fontSize,
              color: PdfColors.deepPurple800,
            ),
          ),
        ),
        pw.Container(
          padding: const pw.EdgeInsets.symmetric(vertical: 4, horizontal: 6),
          child: pw.Row(
            children: [
              pw.Text(
                value,
                style: pw.TextStyle(
                  fontSize: fontSize,
                  color: PdfColors.deepPurple800,
                ),
              ),
              pw.SizedBox(width: 4),
              pw.Container(
                padding:
                    const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: pw.BoxDecoration(
                  color: PdfColors.green100,
                  borderRadius: pw.BorderRadius.circular(8),
                ),
                child: pw.Text(
                  'Active',
                  style: pw.TextStyle(
                    fontSize: fontSize * 0.8,
                    color: PdfColors.green800,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
