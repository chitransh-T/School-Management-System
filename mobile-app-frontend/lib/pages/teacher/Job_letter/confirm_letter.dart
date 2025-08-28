import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
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
import 'package:sms/widgets/pdf_widgets/school_header.dart';
import 'package:sms/widgets/pdf_widgets/pdf_photo.dart';
import 'package:sms/widgets/pdf_widgets/pdf_info_table.dart';
import 'package:sms/models/teacher_model.dart';

class TeacherAdmissionConfirmationPage extends StatefulWidget {
  final Teacher teacher;
  static final String baseeUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  const TeacherAdmissionConfirmationPage({super.key, required this.teacher});

  @override
  State<TeacherAdmissionConfirmationPage> createState() =>
      _TeacherAdmissionConfirmationPageState();
}

class _TeacherAdmissionConfirmationPageState
    extends State<TeacherAdmissionConfirmationPage> {
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
            final cleanBaseUrl =
                TeacherAdmissionConfirmationPage.baseeUrl.endsWith('/')
                    ? TeacherAdmissionConfirmationPage.baseeUrl.substring(
                        0, TeacherAdmissionConfirmationPage.baseeUrl.length - 1)
                    : TeacherAdmissionConfirmationPage.baseeUrl;
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
        title: 'Job Letter',
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
                    'JOB CONFIRMATION',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.deepPurple[900],
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Teacher photo
                  ProfilePhoto(
                    photoUrl: widget.teacher.teacherPhoto,
                    baseUrl: TeacherAdmissionConfirmationPage.baseeUrl,
                    size: 120,
                  ),
                  const SizedBox(height: 20),
                  // Teacher information table
                  InfoTable(
                    context: context,
                    rows: [
                      {
                        'text': 'Teacher Name',
                        'value': widget.teacher.name,
                        'isHeader': true,
                      },
                      {
                        'text': 'Qualification',
                        'value': widget.teacher.qualification,
                        'isHeader': false,
                      },
                      {
                        'text': 'Experience',
                        'value': widget.teacher.experience,
                        'isHeader': false,
                      },
                      {
                        'text': 'Salary',
                        'value': widget.teacher.salary,
                        'isHeader': false,
                      },
                      {
                        'text': 'Date of Joining',
                        'value': widget.teacher.dateOfJoining,
                        'isHeader': false,
                        // 'copyEnabled': true,
                      },
                      {
                        'text': 'Phone',
                        'value': widget.teacher.phone,
                        'isHeader': false,
                        'copyEnabled': true,
                      },
                      {
                        'text': 'Account Status',
                        'value': 'Active',
                        'isHeader': false,
                        'status': true,
                      },
                      {
                        'text': 'Username',
                        'value': widget.teacher.email,
                        'isHeader': false,
                        'copyEnabled': true,
                      },
                      {
                        'text': 'Password',
                        'value': widget.teacher.password,
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

    // Load teacher photo
    pw.MemoryImage? teacherImage;
    if (widget.teacher.teacherPhoto.isNotEmpty) {
      final photoUrl = widget.teacher.teacherPhoto.startsWith('http')
          ? widget.teacher.teacherPhoto
          : '${TeacherAdmissionConfirmationPage.baseeUrl}/Uploads/${widget.teacher.teacherPhoto}';
      teacherImage = await PdfUtils.fetchImage(photoUrl);
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
                'JOB CONFIRMATION',
                style: pw.TextStyle(
                  fontSize: 22,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColors.purple900,
                ),
              ),
              pw.SizedBox(height: 20),
              // Teacher photo
              pw.Container(
                width: 120,
                height: 120,
                decoration: pw.BoxDecoration(
                  shape: pw.BoxShape.circle,
                  border: pw.Border.all(color: PdfColors.purple200, width: 2),
                ),
                child: teacherImage != null
                    ? pw.ClipOval(
                        child: pw.Image(teacherImage, fit: pw.BoxFit.cover))
                    : pw.Center(child: pw.Text('PHOTO')),
              ),
              pw.SizedBox(height: 20),
              // Teacher information table
              pw.Container(
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.purple100),
                  borderRadius: pw.BorderRadius.circular(12),
                ),
                child: pw.Table(
                  border: pw.TableBorder.symmetric(
                    inside: const pw.BorderSide(color: PdfColors.purple100),
                  ),
                  columnWidths: const {
                    0: pw.FlexColumnWidth(1.2),
                    1: pw.FlexColumnWidth(2),
                  },
                  children: [
                    PdfTables.buildHeaderRow(['Field', 'Value']),
                    PdfTables.buildRow(['Teacher Name', widget.teacher.name]),
                    PdfTables.buildRow(
                        ['Qualification', widget.teacher.qualification]),
                    PdfTables.buildRow(
                        ['Experience', widget.teacher.experience]),
                    PdfTables.buildRow(['Salary', widget.teacher.salary]),
                    PdfTables.buildStatusRow('Account Status', 'Active'),
                    PdfTables.buildRow(['Phone', widget.teacher.phone]),
                    PdfTables.buildRow(['Username', widget.teacher.email]),
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
                  color: PdfColors.purple50,
                  borderRadius: pw.BorderRadius.circular(8),
                ),
                child: pw.Column(
                  children: [
                    pw.Text(
                      'Important Note:',
                      style: pw.TextStyle(
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColors.purple900),
                    ),
                    pw.SizedBox(height: 5),
                    pw.Text(
                      'Please keep this job confirmation letter for your records. Your username and password will be required to access the teacher portal.',
                      textAlign: pw.TextAlign.center,
                      style: const pw.TextStyle(color: PdfColors.purple900),
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
