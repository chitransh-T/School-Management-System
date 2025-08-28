import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/pages/services/profile_service.dart';
import 'package:sms/widgets/pdf_widgets/pdf_header.dart';
import 'package:sms/widgets/pdf_widgets/pdf_tables.dart';
import 'package:sms/widgets/pdf_widgets/pdf_signature.dart' as custom_signature;
import 'package:sms/widgets/pdf_widgets/pdf_utils.dart';
import 'package:sms/widgets/pdf_widgets/pdf_photo.dart';
import 'package:sms/widgets/pdf_widgets/pdf_info_table.dart';
import 'package:sms/widgets/pdf_widgets/school_header.dart';
import 'package:sms/models/student_model.dart';

class AdmissionConfirmationPage extends StatefulWidget {
  final Student student;
  static final String baseeUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  const AdmissionConfirmationPage({super.key, required this.student});

  @override
  State<AdmissionConfirmationPage> createState() =>
      _AdmissionConfirmationPageState();
}

class _AdmissionConfirmationPageState extends State<AdmissionConfirmationPage> {
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
            final cleanBaseUrl = AdmissionConfirmationPage.baseeUrl
                    .endsWith('/')
                ? AdmissionConfirmationPage.baseeUrl
                    .substring(0, AdmissionConfirmationPage.baseeUrl.length - 1)
                : AdmissionConfirmationPage.baseeUrl;
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
      appBar: const CustomAppBar(
        title: 'Admission Confirmation',
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
                    'ADMISSION CONFIRMATION',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.deepPurple[900],
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Student photo
                  ProfilePhoto(
                    photoUrl: widget.student.studentPhoto,
                    baseUrl: AdmissionConfirmationPage.baseeUrl,
                    size: 120,
                  ),
                  const SizedBox(height: 20),
                  // Student information table
                  InfoTable(
                    context: context,
                    rows: [
                      {
                        'text': 'Student Name',
                        'value': widget.student.name,
                        'isHeader': true,
                      },
                      {
                        'text': 'Registration/ID',
                        'value': widget.student.registrationNumber,
                        'isHeader': false,
                      },
                      {
                        'text': 'Class',
                        'value':
                            '${widget.student.assignedClass} - ${widget.student.assignedSection}',
                        'isHeader': false,
                      },
                      {
                        'text': 'Admission Date',
                        'value': DateFormat('dd MMMM, yyyy')
                            .format(widget.student.admissionDate),
                        'isHeader': false,
                      },
                      {
                        'text': 'Account Status',
                        'value': 'Active',
                        'isHeader': false,
                        'status': true,
                      },
                      {
                        'text': 'Username',
                        'value': widget.student.username,
                        'isHeader': false,
                        'copyEnabled': true,
                      },
                      {
                        'text': 'Password',
                        'value': widget.student.password,
                        'isHeader': false,
                        'copyEnabled': true,
                        'isPassword': true,
                      },
                    ],
                  ),
                  const SizedBox(height: 30),
                  CustomButton(
                    text: 'Print',
                    icon: Icons.print,
                    width: 150,
                    onPressed: () => _generatePdf(context),
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

    // Load student photo
    pw.MemoryImage? studentImage;
    if (widget.student.studentPhoto.isNotEmpty) {
      final photoUrl = widget.student.studentPhoto.startsWith('http')
          ? widget.student.studentPhoto
          : '${AdmissionConfirmationPage.baseeUrl}/Uploads/${widget.student.studentPhoto}';
      studentImage = await PdfUtils.fetchImage(photoUrl);
    }

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.center,
            children: [
              PdfHeader.build(
                instituteName: instituteName!,
                logoImage: logoImage,
              ),
              pw.SizedBox(height: 24),
              pw.Text(
                'ADMISSION CONFIRMATION',
                style: pw.TextStyle(
                  fontSize: 22,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColors.deepPurple900,
                ),
              ),
              pw.SizedBox(height: 20),
              // Student photo
              pw.Container(
                width: 120,
                height: 120,
                decoration: pw.BoxDecoration(
                  shape: pw.BoxShape.circle,
                  border:
                      pw.Border.all(color: PdfColors.deepPurple200, width: 2),
                ),
                child: studentImage != null
                    ? pw.ClipOval(
                        child: pw.Image(studentImage, fit: pw.BoxFit.cover))
                    : pw.Center(child: pw.Text('PHOTO')),
              ),
              pw.SizedBox(height: 20),
              // Student information table
              pw.Container(
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.deepPurple100),
                  borderRadius: pw.BorderRadius.circular(12),
                ),
                child: pw.Table(
                  border: pw.TableBorder.symmetric(
                    inside: const pw.BorderSide(color: PdfColors.deepPurple100),
                  ),
                  columnWidths: const {
                    0: pw.FlexColumnWidth(1.2),
                    1: pw.FlexColumnWidth(2),
                  },
                  children: [
                    PdfTables.buildHeaderRow(['Field', 'Value']),
                    PdfTables.buildRow(['Student Name', widget.student.name]),
                    PdfTables.buildRow(
                        ['Registration/ID', widget.student.registrationNumber]),
                    PdfTables.buildRow([
                      'Class',
                      '${widget.student.assignedClass} - ${widget.student.assignedSection}'
                    ]),
                    PdfTables.buildStatusRow('Account Status', 'Active'),
                    PdfTables.buildRow(['Username', widget.student.username]),
                    PdfTables.buildRow(['Password', '••••••••']),
                  ],
                ),
              ),
              pw.SizedBox(height: 40),
              custom_signature.PdfSignature.build(),
              pw.SizedBox(height: 40),
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.all(10),
                decoration: pw.BoxDecoration(
                  color: PdfColors.deepPurple50,
                  borderRadius: pw.BorderRadius.circular(8),
                ),
                child: pw.Column(
                  children: [
                    pw.Text(
                      'Important Note:',
                      style: pw.TextStyle(
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColors.deepPurple900),
                    ),
                    pw.SizedBox(height: 5),
                    pw.Text(
                      'Please keep this admission letter for your records...',
                      textAlign: pw.TextAlign.center,
                      style: const pw.TextStyle(color: PdfColors.deepPurple900),
                    ),
                  ],
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
