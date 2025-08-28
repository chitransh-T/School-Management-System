import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:intl/intl.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:sms/widgets/pdf_widgets/pdf_header.dart';
import 'package:sms/widgets/pdf_widgets/pdf_tables.dart';
import 'package:sms/widgets/pdf_widgets/pdf_signature.dart' as custom_signature;
import 'package:sms/widgets/pdf_widgets/pdf_utils.dart';
import 'package:url_launcher/url_launcher.dart';

class StudentFeeRecord extends StatefulWidget {
  const StudentFeeRecord({super.key});

  @override
  State<StudentFeeRecord> createState() => _StudentFeeRecordState();
}

class _StudentFeeRecordState extends State<StudentFeeRecord> {
  bool isLoading = true;
  String? errorMessage;
  List<Map<String, dynamic>> studentData = [];
  Map<String, List<Map<String, dynamic>>> paymentHistory = {};
  Map<String, Map<String, bool>> paidMonths = {};
  Map<String, bool> isYearlyPaid = {};
  String? instituteName;
  String? logoUrlFull;
  final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';
  Map<String, double> totalYearlyFee = {};
  Map<String, double> totalPaid = {};
  Map<String, double> totalDue = {};

  List<String> months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  @override
  void initState() {
    super.initState();
    fetchParentData();
  }

  Future<void> fetchParentData() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) {
      setState(() {
        errorMessage = 'Token missing. Please login again.';
        isLoading = false;
      });
      return;
    }

    try {
      // Fetch student data
      final studentResponse = await http.get(
        Uri.parse('$baseUrl/api/dashboard/students'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      debugPrint(
          'Student API Response: ${studentResponse.statusCode} - ${studentResponse.body}');

      if (studentResponse.statusCode == 200) {
        final data = json.decode(studentResponse.body);
        final List students = data['data'] ?? [];

        // Remove duplicate students based on student_id
        final uniqueStudentIds = <String>{};
        final uniqueStudents = <Map<String, dynamic>>[];
        for (var s in students) {
          final studentId = s['student_id']?.toString() ??
              s['id']?.toString() ??
              s['_id']?.toString();
          if (studentId != null && !uniqueStudentIds.contains(studentId)) {
            uniqueStudentIds.add(studentId);
            uniqueStudents.add(Map<String, dynamic>.from(s));
          }
        }

        setState(() {
          studentData = uniqueStudents;
        });

        // Fetch payment history and yearly summary for each student
        for (var student in studentData) {
          final studentId = student['student_id']?.toString() ??
              student['id']?.toString() ??
              student['_id']?.toString();
          debugPrint('Fetching payment history for studentId: $studentId');
          if (studentId != null) {
            await fetchPaymentHistory(studentId);
            // await fetchYearlySummary(studentId);
          }
        }

        // Fetch profile data
        await fetchProfileData();
      } else {
        setState(() {
          errorMessage =
              'Failed to load student data: ${studentResponse.statusCode}';
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error fetching student data: $e';
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> fetchProfileData() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) {
      setState(() {
        instituteName = 'ALMANET SCHOOL';
        logoUrlFull = null;
      });
      return;
    }

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/profile'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      debugPrint(
          'Profile API Response: ${response.statusCode} - ${response.body}');

      if (response.statusCode == 200) {
        final profile = jsonDecode(response.body);
        final innerData = profile['data'];
        if (innerData != null && mounted) {
          setState(() {
            instituteName = innerData['institute_name'] ?? 'ALMANET SCHOOL';
            final logoUrl = innerData['logo_url'] ?? '';
            if (logoUrl.isNotEmpty) {
              final cleanBaseUrl = baseUrl.endsWith('/')
                  ? baseUrl.substring(0, baseUrl.length - 1)
                  : baseUrl;
              final cleanLogoUrl =
                  logoUrl.startsWith('/') ? logoUrl : '/$logoUrl';
              logoUrlFull = logoUrl.startsWith('http')
                  ? logoUrl
                  : cleanBaseUrl + cleanLogoUrl;
            } else {
              logoUrlFull = null;
            }
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching profile: $e');
      setState(() {
        instituteName = 'ALMANET SCHOOL';
        logoUrlFull = null;
      });
    }
  }

  Future<void> fetchPaymentHistory(String studentId) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) {
      debugPrint('No token found');
      setState(() {
        errorMessage = 'No authentication token found';
      });
      return;
    }

    try {
      // Fetch payment history
      final response = await http.get(
        Uri.parse('$baseUrl/api/history/$studentId'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      debugPrint(
          'Payment History API Response for student $studentId: ${response.statusCode} - ${response.body}');

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        final List<dynamic> payments = responseData['data'] ?? [];

        // Group payments by payment_date to combine fee_items
        final groupedPayments = <String, Map<String, dynamic>>{};
        for (var item in payments) {
          final paymentDate = item['payment_date'] != null
              ? DateFormat('dd/MM/yyyy')
                  .format(DateTime.parse(item['payment_date']).toLocal())
              : 'N/A';
          final feeMonth = (item['fee_month']?.toString() ?? '').isNotEmpty
              ? [item['fee_month'].toString()]
              : [];
          final isYearly = item['is_yearly'] == true;

          final feeItem = {
            'fee_name': item['fee_name']?.toString() ?? 'Unknown',
            'amount': (item['amount'] is num)
                ? (item['amount'] as num).toDouble()
                : double.tryParse(item['amount']?.toString() ?? '0') ?? 0.0,
            'is_monthly': item['is_monthly'] == true,
            'is_yearly': isYearly,
            'is_one_time': item['is_one_time'] == true,
          };

          final key = '$paymentDate-${item['remark'] ?? 'N/A'}';
          if (!groupedPayments.containsKey(key)) {
            groupedPayments[key] = {
              'payment_id': item['id']?.toString() ?? '',
              'fee_months': isYearly ? ['Yearly'] : feeMonth,
              'payment_date': paymentDate,
              'deposit_amount': 0.0,
              'total_paid': (item['total_paid'] is num)
                  ? (item['total_paid'] as num).toDouble()
                  : double.tryParse(item['total_paid']?.toString() ?? '0') ??
                      0.0,
              'total_due': (item['total_due'] is num)
                  ? (item['total_due'] as num).toDouble()
                  : double.tryParse(item['total_due']?.toString() ?? '0') ??
                      0.0,
              'remark': item['remark']?.toString() ?? 'N/A',
              'is_yearly_payment': isYearly,
              'fee_items': <Map<String, dynamic>>[],
            };
          }
          groupedPayments[key]!['fee_items'].add(feeItem);
          groupedPayments[key]!['deposit_amount'] += feeItem['amount'];
        }

        if (mounted) {
          setState(() {
            paymentHistory[studentId] = groupedPayments.values.toList();

            // Update paidMonths
            paidMonths[studentId] ??= {};
            for (var payment in paymentHistory[studentId]!) {
              final feeMonths = payment['fee_months'] as List<dynamic>;
              if (feeMonths.contains('Yearly')) {
                isYearlyPaid[studentId] = true;
                for (var month in months) {
                  paidMonths[studentId]![month] = true;
                }
              } else {
                for (var month in feeMonths) {
                  paidMonths[studentId]![month] = true;
                }
              }
            }

            debugPrint(
                'Payment History for $studentId: ${paymentHistory[studentId]}');
            debugPrint('Paid Months for $studentId: ${paidMonths[studentId]}');
          });
        }
      } else {
        setState(() {
          errorMessage =
              'Failed to fetch payment history: ${response.statusCode}';
        });
      }

      // Fetch payment status to ensure consistency
      final statusResponse = await http.get(
        Uri.parse('$baseUrl/api/payment-status/$studentId'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      debugPrint(
          'Payment Status API Response for student $studentId: ${statusResponse.statusCode} - ${statusResponse.body}');

      if (statusResponse.statusCode == 200) {
        final paymentStatus = jsonDecode(statusResponse.body)['data'] ?? {};
        if (paymentStatus.isNotEmpty) {
          setState(() {
            paidMonths[studentId] ??= {};
            paymentStatus.forEach((key, value) {
              bool isPaid = false;
              if (value is Map && value.containsKey('fullyPaid')) {
                isPaid = value['fullyPaid'] == true;
              } else if (value is bool) {
                isPaid = value;
              }
              if (months.contains(key) || key == 'Yearly') {
                paidMonths[studentId]![key] = isPaid;
              }
            });
            if (paidMonths[studentId]!['Yearly'] == true) {
              isYearlyPaid[studentId] = true;
              for (var month in months) {
                paidMonths[studentId]![month] = true;
              }
            }
            debugPrint(
                'Updated Paid Months for $studentId: ${paidMonths[studentId]}');
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching payment history for student $studentId: $e');
      setState(() {
        errorMessage = 'Error fetching payment history: $e';
      });
    }
  }

  // Future<void> fetchYearlySummary(String studentId) async {
  //   final prefs = await SharedPreferences.getInstance();
  //   final token = prefs.getString('token');
  //   if (token == null) return;

  //   try {
  //     final response = await http.get(
  //       Uri.parse('$baseUrl/api/yearly-summary/$studentId'),
  //       headers: {
  //         'Accept': 'application/json',
  //         'Content-Type': 'application/json',
  //         'Authorization': 'Bearer $token',
  //       },
  //     );

  //     debugPrint(
  //         'Yearly Summary API Response for student $studentId: ${response.statusCode} - ${response.body}');

  //     if (response.statusCode == 200) {
  //       final responseData = jsonDecode(response.body);
  //       final data =
  //           responseData is Map ? (responseData['data'] ?? responseData) : {};

  //       if (mounted) {
  //         // Fetch fee structure to calculate totalYearlyFee
  //         final student = studentData.firstWhere(
  //           (s) =>
  //               s['student_id']?.toString() == studentId ||
  //               s['id']?.toString() == studentId ||
  //               s['_id']?.toString() == studentId,
  //           orElse: () => {'assigned_class': ''},
  //         );
  //         final className = student['assigned_class']?.toString() ?? '';
  //         String? classId;

  //         // Get classId
  //         final classResponse = await http.get(
  //           Uri.parse('$baseUrl/api/classes'),
  //           headers: {
  //             'Accept': 'application/json',
  //             'Content-Type': 'application/json',
  //             'Authorization': 'Bearer $token',
  //           },
  //         );

  //         if (classResponse.statusCode == 200) {
  //           final List<dynamic> classData = json.decode(classResponse.body);
  //           for (final data in classData) {
  //             final classNameData =
  //                 (data['class_name'] ?? data['className'] ?? '')
  //                     .toString()
  //                     .trim();
  //             if (classNameData.toLowerCase() == className.toLowerCase()) {
  //               classId =
  //                   data['id']?.toString() ?? data['class_id']?.toString();
  //               break;
  //             }
  //           }
  //         }

  //         classId ??= className;

  //         // Fetch fee structure
  //         final feeResponse = await http.get(
  //           Uri.parse(
  //               '$baseUrl/api/structure?classId=$classId&studentId=$studentId'),
  //           headers: {'Authorization': 'Bearer $token'},
  //         );

  //         double yearlyFee = 0.0;
  //         if (feeResponse.statusCode == 200) {
  //           final feeData = jsonDecode(feeResponse.body);
  //           if (feeData['success']) {
  //             final feeStructure = (feeData['data'] as List).map((item) {
  //               return {
  //                 'amount': item['amount'] is num
  //                     ? item['amount'].toString()
  //                     : item['amount']?.toString() ?? '0.0',
  //               };
  //             }).toList();
  //             yearlyFee = feeStructure.fold(0.0,
  //                 (sum, fee) => sum + (double.tryParse(fee['amount']!) ?? 0.0));
  //           }
  //         }

  //         setState(() {
  //           totalYearlyFee[studentId] = yearlyFee;
  //           totalPaid[studentId] = (data['total_paid']?.toDouble() ?? 0.0);
  //           totalDue[studentId] = yearlyFee - totalPaid[studentId]!;
  //           if (totalDue[studentId]! < 0) totalDue[studentId] = 0.0;
  //           debugPrint(
  //               'Yearly Summary for $studentId: totalYearlyFee=${totalYearlyFee[studentId]}, totalPaid=${totalPaid[studentId]}, totalDue=${totalDue[studentId]}');
  //         });
  //       }
  //     }
  //   } catch (e) {
  //     debugPrint('Error fetching yearly summary for student $studentId: $e');
  //   }
  // }

  Future<void> openPdf(String pdfPath) async {
    final fileName = Uri.encodeComponent(pdfPath.split('/').last);
    final pdfUrl = '$baseUrl/Uploads/$fileName';
    final uri = Uri.parse(pdfUrl);

    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      setState(() {
        errorMessage = 'Could not open PDF: $pdfUrl';
      });
    }
  }

  Future<void> generatePdf(BuildContext context, Map<String, dynamic> payment,
      Map<String, dynamic> student) async {
    final pdf = pw.Document();
    final logoImage =
        logoUrlFull != null ? await PdfUtils.fetchImage(logoUrlFull!) : null;
    final robotoBold = await PdfGoogleFonts.robotoBold();

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
              PdfHeader.build(
                instituteName: instituteName ?? 'ALMANET SCHOOL',
                logoImage: logoImage,
                logoSize: 36,
              ),
              pw.SizedBox(height: 6),
              pw.Center(
                child: pw.Text(
                  'FEE RECEIPT',
                  style: pw.TextStyle(
                    font: robotoBold,
                    fontSize: 16,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColors.blue900,
                  ),
                ),
              ),
              pw.SizedBox(height: 8),
              pw.Container(
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.blue100),
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Table(
                  border: pw.TableBorder.symmetric(
                    inside: const pw.BorderSide(color: PdfColors.blue100),
                  ),
                  columnWidths: const {
                    0: pw.FlexColumnWidth(1.3),
                    1: pw.FlexColumnWidth(2),
                  },
                  children: [
                    PdfTables.buildHeaderRow(
                      ['Field', 'Value'],
                      fontSize: 9,
                    ),
                    PdfTables.buildRow(
                      ['Student Name', student['student_name'] ?? 'N/A'],
                      fontSize: 9,
                    ),
                    PdfTables.buildRow(
                      ['Class', student['assigned_class'] ?? 'N/A'],
                      fontSize: 9,
                    ),
                    PdfTables.buildRow(
                      ['Section', student['assigned_section'] ?? 'N/A'],
                      fontSize: 9,
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 8),
              pw.Container(
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.blue100),
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Table(
                  border: pw.TableBorder.symmetric(
                    inside: const pw.BorderSide(color: PdfColors.blue100),
                  ),
                  columnWidths: const {
                    0: pw.FlexColumnWidth(1.3),
                    1: pw.FlexColumnWidth(2),
                  },
                  children: [
                    PdfTables.buildHeaderRow(
                      ['Field', 'Value'],
                      fontSize: 9,
                    ),
                    PdfTables.buildRow(
                      ['Payment Date', payment['payment_date']],
                      fontSize: 9,
                    ),
                    PdfTables.buildRow(
                      [
                        'Payment Type',
                        payment['is_yearly_payment'] ? 'Yearly' : 'Monthly'
                      ],
                      fontSize: 9,
                    ),
                    PdfTables.buildRow(
                      [
                        'Fee Months',
                        payment['fee_months'].isEmpty
                            ? 'N/A'
                            : payment['fee_months'].join(', ')
                      ],
                      fontSize: 9,
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 8),
              pw.Text(
                'Fee Breakdown',
                style: pw.TextStyle(
                  font: robotoBold,
                  fontSize: 12,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColors.blue900,
                ),
              ),
              pw.SizedBox(height: 4),
              pw.Container(
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.blue100),
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Table(
                  border: pw.TableBorder.symmetric(
                    inside: const pw.BorderSide(color: PdfColors.blue100),
                  ),
                  columnWidths: const {
                    0: pw.FlexColumnWidth(1.3),
                    1: pw.FlexColumnWidth(2),
                  },
                  children: [
                    PdfTables.buildHeaderRow(
                      ['Fee Name', 'Amount'],
                      fontSize: 9,
                    ),
                    ...payment['fee_items'].map((item) => PdfTables.buildRow(
                          [
                            item['fee_name'] ?? 'Unknown',
                            'Rs.${(item['amount'] as num).toStringAsFixed(2)}'
                          ],
                          fontSize: 9,
                        )),
                  ],
                ),
              ),
              pw.SizedBox(height: 8),
              pw.Text(
                'Summary',
                style: pw.TextStyle(
                  font: robotoBold,
                  fontSize: 12,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColors.blue900,
                ),
              ),
              pw.SizedBox(height: 4),
              pw.Container(
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.blue100),
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Table(
                  border: pw.TableBorder.symmetric(
                    inside: const pw.BorderSide(color: PdfColors.blue100),
                  ),
                  columnWidths: const {
                    0: pw.FlexColumnWidth(1.3),
                    1: pw.FlexColumnWidth(2),
                  },
                  children: [
                    PdfTables.buildHeaderRow(
                      ['Field', 'Value'],
                      fontSize: 9,
                    ),
                    PdfTables.buildRow(
                      [
                        'Total Amount',
                        'Rs.${payment['deposit_amount'].toStringAsFixed(2)}'
                      ],
                      fontSize: 9,
                    ),
                    PdfTables.buildRow(
                      [
                        'Total Paid (Cumulative)',
                        'Rs.${payment['total_paid'].toStringAsFixed(2)}'
                      ],
                      fontSize: 9,
                      valueColor: PdfColors.green600,
                    ),
                    PdfTables.buildRow(
                      [
                        'Total Due',
                        'Rs.${payment['total_due'].toStringAsFixed(2)}'
                      ],
                      fontSize: 9,
                      valueColor: PdfColors.red600,
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 20),
              custom_signature.PdfSignature.build(
                compact: true,
              ),
              pw.SizedBox(height: 8),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final deepPurpleTheme = Colors.deepPurple.shade900;
    final whiteTheme = Colors.white;

    return Scaffold(
      appBar: CustomAppBar(title: 'Parent Dashboard'),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : errorMessage != null
              ? Center(child: Text(errorMessage!))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 16),
                      ...studentData.map((student) {
                        final studentId = student['student_id']?.toString() ??
                            student['id']?.toString() ??
                            student['_id']?.toString() ??
                            '';
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Card(
                              elevation: 4,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      deepPurpleTheme,
                                      Colors.deepPurple.shade700,
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(Icons.person,
                                              color: Colors.white, size: 20),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              'Student: ${student['student_name'] ?? 'N/A'}',
                                              style: const TextStyle(
                                                fontSize: 18,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.white,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),
                                      Row(
                                        children: [
                                          const Icon(Icons.school,
                                              color: Colors.white, size: 20),
                                          const SizedBox(width: 8),
                                          Text(
                                            'Class: ${student['assigned_class'] ?? 'N/A'}',
                                            style: const TextStyle(
                                              fontSize: 16,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),
                                      Row(
                                        children: [
                                          const Icon(Icons.class_,
                                              color: Colors.white, size: 20),
                                          const SizedBox(width: 8),
                                          Text(
                                            'Section: ${student['assigned_section'] ?? 'N/A'}',
                                            style: const TextStyle(
                                              fontSize: 16,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ],
                                      ),
                                      // const SizedBox(height: 16),
                                      // const Divider(color: Colors.white70),
                                      // const SizedBox(height: 16),
                                      // Text(
                                      //   'Yearly Fee Summary',
                                      //   style: TextStyle(
                                      //     color: whiteTheme,
                                      //     fontSize: 16,
                                      //     fontWeight: FontWeight.bold,
                                      //   ),
                                      // ),
                                      // const SizedBox(height: 12),
                                      // Card(
                                      //   elevation: 4,
                                      //   shape: RoundedRectangleBorder(
                                      //     borderRadius:
                                      //         BorderRadius.circular(12),
                                      //   ),
                                      //   child: Padding(
                                      //     padding: EdgeInsets.all(16),
                                      //     child: Column(
                                      //       crossAxisAlignment:
                                      //           CrossAxisAlignment.start,
                                      //       children: [
                                      //         Row(
                                      //           mainAxisAlignment:
                                      //               MainAxisAlignment
                                      //                   .spaceBetween,
                                      //           children: [
                                      //             Text(
                                      //               'Total Yearly Fee:',
                                      //               style: TextStyle(
                                      //                 fontSize: 16,
                                      //                 color: Colors.black87,
                                      //               ),
                                      //             ),
                                      //             Text(
                                      //               totalYearlyFee[studentId] ==
                                      //                           null ||
                                      //                       totalYearlyFee[
                                      //                               studentId] ==
                                      //                           0.0
                                      //                   ? 'N/A'
                                      //                   : '₹${totalYearlyFee[studentId]!.toStringAsFixed(2)}',
                                      //               style: TextStyle(
                                      //                 fontSize: 16,
                                      //                 fontWeight:
                                      //                     FontWeight.bold,
                                      //                 color: totalYearlyFee[
                                      //                                 studentId] ==
                                      //                             null ||
                                      //                         totalYearlyFee[
                                      //                                 studentId] ==
                                      //                             0.0
                                      //                     ? Colors.grey.shade600
                                      //                     : deepPurpleTheme,
                                      //               ),
                                      //             ),
                                      //           ],
                                      //         ),
                                      //         SizedBox(height: 8),
                                      //         Row(
                                      //           mainAxisAlignment:
                                      //               MainAxisAlignment
                                      //                   .spaceBetween,
                                      //           children: [
                                      //             Text(
                                      //               'Total Paid:',
                                      //               style: TextStyle(
                                      //                 fontSize: 16,
                                      //                 color: Colors.black87,
                                      //               ),
                                      //             ),
                                      //             Text(
                                      //               totalPaid[studentId] ==
                                      //                           null ||
                                      //                       totalPaid[
                                      //                               studentId] ==
                                      //                           0.0
                                      //                   ? 'N/A'
                                      //                   : '₹${totalPaid[studentId]!.toStringAsFixed(2)}',
                                      //               style: TextStyle(
                                      //                 fontSize: 16,
                                      //                 fontWeight:
                                      //                     FontWeight.bold,
                                      //                 color: totalPaid[
                                      //                                 studentId] ==
                                      //                             null ||
                                      //                         totalPaid[
                                      //                                 studentId] ==
                                      //                             0.0
                                      //                     ? Colors.grey.shade600
                                      //                     : Colors
                                      //                         .green.shade600,
                                      //               ),
                                      //             ),
                                      //           ],
                                      //         ),
                                      //         SizedBox(height: 8),
                                      //         Row(
                                      //           mainAxisAlignment:
                                      //               MainAxisAlignment
                                      //                   .spaceBetween,
                                      //           children: [
                                      //             Text(
                                      //               'Total Due:',
                                      //               style: TextStyle(
                                      //                 fontSize: 16,
                                      //                 color: Colors.black87,
                                      //               ),
                                      //             ),
                                      //             Text(
                                      //               totalYearlyFee[studentId] !=
                                      //                           null &&
                                      //                       totalYearlyFee[
                                      //                               studentId]! >
                                      //                           0 &&
                                      //                       totalDue[
                                      //                               studentId] ==
                                      //                           0.0
                                      //                   ? '₹${(totalYearlyFee[studentId]! - (totalPaid[studentId] ?? 0.0)).toStringAsFixed(2)}'
                                      //                   : totalDue[studentId] ==
                                      //                               null ||
                                      //                           totalDue[
                                      //                                   studentId] ==
                                      //                               0.0
                                      //                       ? 'N/A'
                                      //                       : '₹${totalDue[studentId]!.toStringAsFixed(2)}',
                                      //               style: TextStyle(
                                      //                 fontSize: 16,
                                      //                 fontWeight:
                                      //                     FontWeight.bold,
                                      //                 color: (totalDue[
                                      //                                     studentId] ==
                                      //                                 null ||
                                      //                             totalDue[
                                      //                                     studentId] ==
                                      //                                 0.0) &&
                                      //                         totalYearlyFee[
                                      //                                 studentId] !=
                                      //                             null &&
                                      //                         totalYearlyFee[
                                      //                                 studentId]! >
                                      //                             0
                                      //                     ? Colors.red.shade600
                                      //                     : totalDue[studentId] ==
                                      //                                 null ||
                                      //                             totalDue[
                                      //                                     studentId] ==
                                      //                                 0.0
                                      //                         ? Colors
                                      //                             .grey.shade600
                                      //                         : Colors
                                      //                             .red.shade600,
                                      //               ),
                                      //             ),
                                      //           ],
                                      //         ),
                                      //       ],
                                      // ),
                                      // ),
                                      // ),
                                      const SizedBox(height: 16),
                                      const Divider(color: Colors.white70),
                                      const SizedBox(height: 16),
                                      Text(
                                        'Paid Months',
                                        style: TextStyle(
                                          color: whiteTheme,
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Wrap(
                                        spacing: 8,
                                        runSpacing: 8,
                                        children: months.map((month) {
                                          final isPaid = paidMonths[studentId]
                                                  ?[month] ==
                                              true;
                                          return ChoiceChip(
                                            label: Text(month),
                                            selected: isPaid,
                                            selectedColor:
                                                Colors.green.shade600,
                                            backgroundColor:
                                                Colors.grey.shade300,
                                            labelStyle: TextStyle(
                                              color: isPaid
                                                  ? Colors.white
                                                  : Colors.black87,
                                              fontWeight: isPaid
                                                  ? FontWeight.bold
                                                  : FontWeight.normal,
                                            ),
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                              side: BorderSide(
                                                color: isPaid
                                                    ? Colors.green.shade600
                                                    : Colors.grey.shade400,
                                              ),
                                            ),
                                            onSelected:
                                                null, // Disable interaction
                                          );
                                        }).toList(),
                                      ),
                                      const SizedBox(height: 16),
                                      const Divider(color: Colors.white70),
                                      const SizedBox(height: 16),
                                      Text(
                                        'Payment History',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: whiteTheme,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      if (paymentHistory[studentId]?.isEmpty ??
                                          true)
                                        const Text(
                                          'No payment history available',
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.white70,
                                          ),
                                        )
                                      else
                                        ...?paymentHistory[studentId]
                                            ?.map((payment) {
                                          return Card(
                                            color: Colors.white,
                                            margin: const EdgeInsets.only(
                                                bottom: 12),
                                            child: ListTile(
                                              contentPadding:
                                                  const EdgeInsets.all(12),
                                              title: Text(
                                                'Payment on ${payment['payment_date']}',
                                                style: TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  color: deepPurpleTheme,
                                                ),
                                              ),
                                              subtitle: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    'Months: ${payment['fee_months'].join(', ') ?? 'N/A'}',
                                                    style: const TextStyle(
                                                        fontSize: 14),
                                                  ),
                                                  Text(
                                                    'Amount: ₹${payment['deposit_amount'].toStringAsFixed(2)}',
                                                    style: const TextStyle(
                                                        fontSize: 14),
                                                  ),
                                                  Text(
                                                    'Remark: ${payment['remark']}',
                                                    style: const TextStyle(
                                                        fontSize: 14),
                                                  ),
                                                  const SizedBox(height: 8),
                                                  Text(
                                                    'Fees:',
                                                    style: TextStyle(
                                                      fontSize: 14,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      color: deepPurpleTheme,
                                                    ),
                                                  ),
                                                  ...payment['fee_items']
                                                      .map<Widget>(
                                                          (item) => Text(
                                                                '${item['fee_name']}: ₹${item['amount'].toStringAsFixed(2)}',
                                                                style:
                                                                    const TextStyle(
                                                                        fontSize:
                                                                            14),
                                                              )),
                                                ],
                                              ),
                                              trailing: IconButton(
                                                icon: const Icon(
                                                    Icons.picture_as_pdf,
                                                    color: Colors.red),
                                                onPressed: () => generatePdf(
                                                    context, payment, student),
                                              ),
                                            ),
                                          );
                                        }),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        );
                      }),
                    ],
                  ),
                ),
    );
  }
}
