import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/pages/services/profile_service.dart';
import 'package:sms/widgets/pdf_widgets/school_header.dart';
import 'package:sms/widgets/pdf_widgets/pdf_info_table.dart';
import 'package:sms/widgets/pdf_widgets/pdf_header.dart';
import 'package:sms/widgets/pdf_widgets/pdf_tables.dart';
import 'package:sms/widgets/pdf_widgets/pdf_signature.dart' as custom_signature;
import 'package:sms/widgets/pdf_widgets/pdf_utils.dart';

class FeeReceiptPage extends StatefulWidget {
  final String studentId;
  final String studentName;
  final String studentClass;
  final String studentSection;
  final List<String> feeMonths;
  final double totalPaid;
  final double totalDue;
  final double depositAmount;
  final String paymentDate;
  final String remark;
  final bool isYearlyPayment;
  final List<Map<String, dynamic>> feeItems;
  static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  const FeeReceiptPage({
    super.key,
    required this.studentId,
    required this.studentName,
    required this.studentClass,
    required this.studentSection,
    required this.feeMonths,
    required this.totalPaid,
    required this.totalDue,
    required this.depositAmount,
    required this.paymentDate,
    required this.remark,
    required this.isYearlyPayment,
    required this.feeItems,
  });

  @override
  State<FeeReceiptPage> createState() => _FeeReceiptPageState();
}

class _FeeReceiptPageState extends State<FeeReceiptPage> {
  String? instituteName;
  String? logoUrlFull;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProfileData();
  }

  Future<void> _fetchProfileData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) {
        debugPrint('No token found, cannot fetch profile');
        setState(() {
          isLoading = false;
        });
        return;
      }

      final profile = await ProfileService.getProfile();
      final innerData = profile['data'];
      if (innerData != null) {
        setState(() {
          instituteName = innerData['institute_name'] ?? 'ALMANET SCHOOL';
          final logoUrl = innerData['logo_url'] ?? '';
          if (logoUrl.isNotEmpty) {
            final cleanBaseUrl = FeeReceiptPage.baseUrl.endsWith('/')
                ? FeeReceiptPage.baseUrl
                    .substring(0, FeeReceiptPage.baseUrl.length - 1)
                : FeeReceiptPage.baseUrl;
            final cleanLogoUrl =
                logoUrl.startsWith('/') ? logoUrl : '/$logoUrl';
            logoUrlFull = logoUrl.startsWith('http')
                ? logoUrl
                : cleanBaseUrl + cleanLogoUrl;
          } else {
            logoUrlFull = null;
          }
          isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching profile: $e');
      setState(() {
        instituteName = 'ALMANET SCHOOL'; // Fallback
        logoUrlFull = null;
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: const CustomAppBar(
        title: 'Fee Receipt',
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // School header
                  SchoolHeader(
                    instituteName: instituteName,
                    logoUrl: logoUrlFull,
                    logoSize: 72,
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'FEE RECEIPT',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.deepPurple[900],
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Student information
                  InfoTable(
                    context: context,
                    rows: [
                      {
                        'text': 'Student Name',
                        'value': widget.studentName,
                        'isHeader': true,
                      },
                      {
                        'text': 'Class',
                        'value': widget.studentClass,
                        'isHeader': false,
                      },
                      {
                        'text': 'Section',
                        'value': widget.studentSection,
                        'isHeader': false,
                      },
                    ],
                  ),
                  const SizedBox(height: 20),
                  // Payment details
                  InfoTable(
                    context: context,
                    rows: [
                      {
                        'text': 'Payment Date',
                        'value': widget.paymentDate,
                        'isHeader': true,
                      },
                      {
                        'text': 'Payment Type',
                        'value': widget.isYearlyPayment ? 'Yearly' : 'Monthly',
                        'isHeader': false,
                      },
                      {
                        'text': 'Fee Months',
                        'value': widget.feeMonths.isEmpty
                            ? 'N/A'
                            : widget.feeMonths.join(', '),
                        'isHeader': false,
                      },
                    ],
                  ),
                  const SizedBox(height: 20),
                  // Fee breakdown
                  InfoTable(
                    context: context,
                    rows: [
                      {
                        'text': 'Fee Name',
                        'value': 'Amount',
                        'isHeader': true,
                      },
                      ...widget.feeItems.map((item) => {
                            'text': item['fee_name'] ?? 'Unknown',
                            'value':
                                'Rs.${(item['amount'] as num?)?.toStringAsFixed(2) ?? '0.00'}',
                            'isHeader': false,
                          }),
                    ],
                  ),
                  const SizedBox(height: 20),
                  // Summary
                  InfoTable(
                    context: context,
                    rows: [
                      {
                        'text': 'Total Amount',
                        'value':
                            'Rs.${widget.depositAmount.toStringAsFixed(2)}',
                        'isHeader': true,
                      },
                      {
                        'text': 'Total Paid (Cumulative)',
                        'value': 'Rs.${widget.totalPaid.toStringAsFixed(2)}',
                        'isHeader': false,
                        'statusColor': Colors.green[200],
                      },
                      {
                        'text': 'Total Due',
                        'value': 'Rs.${widget.totalDue.toStringAsFixed(2)}',
                        'isHeader': false,
                        'statusColor': Colors.red[200],
                      },
                    ],
                  ),
                  const SizedBox(height: 20),
                  // Remark
                  InfoTable(
                    context: context,
                    rows: [
                      {
                        'text': 'Remark',
                        'value': widget.remark.isEmpty ? 'N/A' : widget.remark,
                        'isHeader': true,
                      },
                    ],
                  ),
                  const SizedBox(height: 30),
                  // Print button
                  CustomButton(
                    text: 'Print',
                    icon: Icons.print,
                    onPressed: () async {
                      await _generatePdf(context);
                    },
                    width: 150,
                  ),
                  const SizedBox(height: 20),
                  // Footer
                  Card(
                    elevation: 3,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.deepPurple[50],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Thank you for your payment!',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          fontStyle: FontStyle.italic,
                          color: Colors.deepPurple,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Future<void> _generatePdf(BuildContext context) async {
    final pdf = pw.Document();
    final instituteName = await PdfUtils.fetchInstituteName();
    final logoUrl = await PdfUtils.fetchLogoUrl();
    final logoImage =
        logoUrl != null ? await PdfUtils.fetchImage(logoUrl) : null;

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4.copyWith(
          marginTop: 12,
          marginBottom: 12,
          marginLeft: 12,
          marginRight: 12,
        ),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // Header
              PdfHeader.build(
                instituteName: instituteName!,
                logoImage: logoImage,
                // fontSize: 14, // Reduced font size
                logoSize: 36, // Reduced logo size
              ),
              pw.SizedBox(height: 6),
              pw.Center(
                child: pw.Text(
                  'FEE RECEIPT',
                  style: pw.TextStyle(
                    fontSize: 16, // Reduced from 18
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColors.deepPurple900,
                  ),
                ),
              ),
              pw.SizedBox(height: 8),
              // Student information
              pw.Container(
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.deepPurple100),
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Table(
                  border: pw.TableBorder.symmetric(
                    inside: const pw.BorderSide(color: PdfColors.deepPurple100),
                  ),
                  columnWidths: const {
                    0: pw.FlexColumnWidth(1.3), // Slightly more compact
                    1: pw.FlexColumnWidth(2),
                  },
                  children: [
                    PdfTables.buildHeaderRow(['Field', 'Value'], fontSize: 9),
                    PdfTables.buildRow(['Student Name', widget.studentName],
                        fontSize: 9),
                    PdfTables.buildRow(['Class', widget.studentClass],
                        fontSize: 9),
                    PdfTables.buildRow(['Section', widget.studentSection],
                        fontSize: 9),
                  ],
                ),
              ),
              pw.SizedBox(height: 8),
              // Payment details
              pw.Container(
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.deepPurple100),
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Table(
                  border: pw.TableBorder.symmetric(
                    inside: const pw.BorderSide(color: PdfColors.deepPurple100),
                  ),
                  columnWidths: const {
                    0: pw.FlexColumnWidth(1.3),
                    1: pw.FlexColumnWidth(2),
                  },
                  children: [
                    PdfTables.buildHeaderRow(['Field', 'Value'], fontSize: 9),
                    PdfTables.buildRow(['Payment Date', widget.paymentDate],
                        fontSize: 9),
                    PdfTables.buildRow([
                      'Payment Type',
                      widget.isYearlyPayment ? 'Yearly' : 'Monthly'
                    ], fontSize: 9),
                    PdfTables.buildRow([
                      'Fee Months',
                      widget.feeMonths.isEmpty
                          ? 'N/A'
                          : widget.feeMonths.join(', ')
                    ], fontSize: 9),
                  ],
                ),
              ),
              pw.SizedBox(height: 8),
              // Fee breakdown
              pw.Text(
                'Fee Breakdown',
                style: pw.TextStyle(
                  fontSize: 12, // Reduced from 14
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColors.deepPurple900,
                ),
              ),
              pw.SizedBox(height: 4),
              pw.Container(
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.deepPurple100),
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Table(
                  border: pw.TableBorder.symmetric(
                    inside: const pw.BorderSide(color: PdfColors.deepPurple100),
                  ),
                  columnWidths: const {
                    0: pw.FlexColumnWidth(1.3),
                    1: pw.FlexColumnWidth(2),
                  },
                  children: [
                    PdfTables.buildHeaderRow(['Fee Name', 'Amount'],
                        fontSize: 9),
                    ...widget.feeItems.map((item) => PdfTables.buildRow([
                          item['fee_name'] ?? 'Unknown',
                          'Rs.${(item['amount'] as num?)?.toStringAsFixed(2) ?? '0.00'}'
                        ], fontSize: 9)),
                  ],
                ),
              ),
              pw.SizedBox(height: 8),
              // Summary
              pw.Text(
                'Summary',
                style: pw.TextStyle(
                  fontSize: 12, // Reduced from 14
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColors.deepPurple900,
                ),
              ),
              pw.SizedBox(height: 4),
              pw.Container(
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.deepPurple100),
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Table(
                  border: pw.TableBorder.symmetric(
                    inside: const pw.BorderSide(color: PdfColors.deepPurple100),
                  ),
                  columnWidths: const {
                    0: pw.FlexColumnWidth(1.3),
                    1: pw.FlexColumnWidth(2),
                  },
                  children: [
                    PdfTables.buildHeaderRow(['Field', 'Value'], fontSize: 9),
                    PdfTables.buildRow([
                      'Total Amount',
                      'Rs.${widget.depositAmount.toStringAsFixed(2)}'
                    ], fontSize: 9),
                    PdfTables.buildRow(
                      [
                        'Total Paid (Cumulative)',
                        'Rs.${widget.totalPaid.toStringAsFixed(2)}'
                      ],
                      fontSize: 9,
                      valueColor: PdfColors.green600,
                    ),
                    PdfTables.buildRow(
                      ['Total Due', 'Rs.${widget.totalDue.toStringAsFixed(2)}'],
                      fontSize: 9,
                      valueColor: PdfColors.red600,
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 20),
              // Signature
              custom_signature.PdfSignature.build(compact: true),
              pw.SizedBox(height: 8),
              // Footer
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.all(6), // Reduced padding
                decoration: pw.BoxDecoration(
                  color: PdfColors.deepPurple50,
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Text(
                  'Thank you for your payment!',
                  textAlign: pw.TextAlign.center,
                  style: pw.TextStyle(
                    fontSize: 9, // Reduced from 10
                    fontStyle: pw.FontStyle.italic,
                    color: PdfColors.deepPurple,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
    );
  }
}
