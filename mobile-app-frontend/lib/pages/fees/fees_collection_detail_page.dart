import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';
import 'fee_receipt_page.dart'; // Import the FeeReceiptPage

class FeesCollectionPage extends StatefulWidget {
  final String studentId;
  final String studentName;
  final String studentClass;
  final String studentSection;
  final bool isNewAdmission;
  final Map<String, dynamic>? preloadedData;

  const FeesCollectionPage({
    super.key,
    required this.studentId,
    required this.studentName,
    required this.studentClass,
    required this.studentSection,
    this.isNewAdmission = false,
    this.preloadedData,
  });

  @override
  State<FeesCollectionPage> createState() => _FeesCollectionPageState();
}

class _FeesCollectionPageState extends State<FeesCollectionPage> {
  final _formKey = GlobalKey<FormState>();
  String? token;
  String? classId;
  DateTime selectedDate = DateTime.now();
  List<String> selectedMonths = [];
  bool isLoading = false;
  bool _isMounted = false;
  bool isYearlyPayment = false;
  bool isFeeDetailsExpanded = true;
  bool hasPaidMonthly = false;
  bool hasPaidYearly = false;
  static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  List<FeeStructureModel> feeStructure = [];
  List<String> paidFeeMasterIds = [];
  Map<String, bool> paidMonths = {};
  Set<int> paidOneTimeFees = {};
  double totalYearlyFee = 0.0;
  double totalPaid = 0.0;
  double totalDue = 0.0;

  Map<int, TextEditingController> feeControllers = {};
  final TextEditingController totalDepositController = TextEditingController();
  final TextEditingController depositController = TextEditingController();
  final TextEditingController dueBalanceController = TextEditingController();
  final TextEditingController remarkController = TextEditingController();

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
    _isMounted = true;
    _initializeControllers();
    _loadToken().then((_) {
      if (_isMounted) {
        if (widget.preloadedData != null) {
          _initializeWithPreloadedData();
        } else {
          _getClassId().then((_) {
            if (_isMounted) {
              _loadFeeData();
              _loadPaymentStatus();
              _loadYearlySummary();
            }
          });
        }
      }
    });
  }

  @override
  void dispose() {
    _isMounted = false;
    feeControllers.forEach((_, controller) => controller.dispose());
    totalDepositController.dispose();
    depositController.dispose();
    dueBalanceController.dispose();
    remarkController.dispose();
    super.dispose();
  }

  void _initializeControllers() {
    depositController.text = '0';
    remarkController.text = '';
    depositController.addListener(_calculateTotals);
  }

  void _initializeWithPreloadedData() {
    if (!_isMounted || widget.preloadedData == null) return;

    setState(() {
      classId = widget.preloadedData!['classId']?.toString();
      final feeStructureData =
          widget.preloadedData!['feeStructure'] as List<dynamic>? ?? [];
      feeStructure = feeStructureData.map((item) {
        if (item is FeeStructureModel) {
          return item;
        } else if (item is Map<String, dynamic>) {
          return FeeStructureModel.fromJson(item);
        } else {
          debugPrint(
              'Unexpected item type in feeStructure: ${item.runtimeType}');
          return FeeStructureModel(
            feeFieldName: '',
            amount: '0.0',
            isCollectable: false,
            isMandatory: false,
            isMonthly: false,
            isOneTime: false,
            feeMasterId: 0,
          );
        }
      }).toList();

      paidFeeMasterIds =
          (widget.preloadedData!['paidFeeMasterIds'] as List<dynamic>?)
                  ?.map((id) => id.toString())
                  .toList() ??
              [];

      paidOneTimeFees = {};
      for (var fee in feeStructure) {
        if (fee.isOneTime &&
            paidFeeMasterIds.contains(fee.feeMasterId.toString())) {
          paidOneTimeFees.add(fee.feeMasterId);
        }
      }

      totalYearlyFee = feeStructure.fold(
          0.0, (sum, fee) => sum + (double.tryParse(fee.amount) ?? 0.0));
      totalPaid =
          (widget.preloadedData!['total_paid'] as num?)?.toDouble() ?? 0.0;
      totalDue = totalYearlyFee - totalPaid;
      if (totalDue < 0) totalDue = 0.0;

      debugPrint('Preloaded paidFeeMasterIds: $paidFeeMasterIds');
      debugPrint('Preloaded paidOneTimeFees: $paidOneTimeFees');
      debugPrint(
          'Preloaded feeStructure: ${feeStructure.map((f) => "${f.feeFieldName}: isOneTime=${f.isOneTime}, feeMasterId=${f.feeMasterId}").toList()}');
      debugPrint('Calculated totalYearlyFee: $totalYearlyFee');

      _initializeFeeControllers();
      isLoading = false;
    });

    _calculateTotals();
    _loadPaymentStatus();
    _loadYearlySummary();
  }

  void _initializeFeeControllers() {
    feeControllers.clear();
    for (var fee in feeStructure) {
      if (paidFeeMasterIds.contains(fee.feeMasterId.toString())) {
        debugPrint(
            'Skipping paid fee: ${fee.feeFieldName} (ID: ${fee.feeMasterId})');
        continue;
      }

      if (fee.isCollectable) {
        double amount = double.tryParse(fee.amount) ?? 0.0;
        if (fee.isMonthly && !isYearlyPayment) {
          amount /= 12;
        }

        feeControllers[fee.feeMasterId] = TextEditingController(
          text: amount.toStringAsFixed(2),
        );
        feeControllers[fee.feeMasterId]!.addListener(_calculateTotals);

        debugPrint(
            'Created controller for fee: ${fee.feeFieldName} (ID: ${fee.feeMasterId}), Amount: ${amount.toStringAsFixed(2)}');
      }
    }
    debugPrint('Initialized feeControllers: ${feeControllers.keys}');
  }

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    if (_isMounted) {
      setState(() {
        token = prefs.getString('token');
      });
    }
  }

  Future<void> _getClassId() async {
    if (token == null) return;

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/classes'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> classData = json.decode(response.body);
        for (final data in classData) {
          final className =
              (data['class_name'] ?? data['className'] ?? '').toString().trim();
          if (className.toLowerCase() == widget.studentClass.toLowerCase()) {
            classId = data['id']?.toString() ?? data['class_id']?.toString();
            break;
          }
        }
        classId ??= widget.studentClass;
      }
    } catch (error) {
      classId = widget.studentClass;
    }
  }

  Future<void> _loadFeeData() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/feestructure/$classId'),
        headers: {'Authorization': 'Bearer $token'},
      );

      debugPrint('Raw API response: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        debugPrint('Decoded JSON: ${jsonEncode(data)}');
        if (data['success']) {
          // Log each item in the data list
          final feeList = data['data'] as List;
          for (var i = 0; i < feeList.length; i++) {
            debugPrint('Fee item $i: ${jsonEncode(feeList[i])}');
          }
          setState(() {
            feeStructure = feeList
                .map((item) => FeeStructureModel.fromJson(item))
                .toList();
            debugPrint('Loaded feeStructure: $feeStructure');
          });
        } else {
          debugPrint('Failed to load fee structure: ${data['message']}');
        }
      } else {
        debugPrint('Error fetching fee structure: ${response.statusCode}');
      }

      final paidFeesResponse = await http.get(
        Uri.parse('$baseUrl/api/fees/paid?studentId=${widget.studentId}'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (paidFeesResponse.statusCode == 200) {
        final paidFeesData = jsonDecode(paidFeesResponse.body);
        setState(() {
          paidFeeMasterIds = List<String>.from(paidFeesData);
          debugPrint('Loaded paidFeeMasterIds: $paidFeeMasterIds');
        });
      }

      _initializeFeeControllers();
      _calculateTotals();
    } catch (e) {
      debugPrint('Exception loading fee data: $e');
    }
  }

  Future<void> _loadPaymentStatus() async {
    if (token == null) return;

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/payment-status/${widget.studentId}'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        Map<String, dynamic> data =
            responseData is Map ? (responseData['data'] ?? responseData) : {};

        if (_isMounted && data.isNotEmpty) {
          setState(() {
            paidMonths = {};
            hasPaidMonthly = false;
            hasPaidYearly = false;

            data.forEach((key, value) {
              bool isPaid = false;
              if (value is Map && value.containsKey('fullyPaid')) {
                isPaid = value['fullyPaid'] == true;
                paidMonths[key] = isPaid;
              } else if (value is bool) {
                isPaid = value;
                paidMonths[key] = isPaid;
              }

              if (isPaid) {
                if (key == 'Yearly') {
                  hasPaidYearly = true;
                } else if (months.contains(key)) {
                  hasPaidMonthly = true;
                }
              }
            });

            if (hasPaidYearly) {
              isYearlyPayment = true;
            } else if (hasPaidMonthly) {
              isYearlyPayment = false;
            }

            selectedMonths.removeWhere((month) => paidMonths[month] == true);

            if (selectedMonths.isEmpty && !hasPaidYearly) {
              final currentMonthIndex = DateTime.now().month - 1;
              for (int i = 0; i < months.length; i++) {
                int index = (currentMonthIndex + i) % months.length;
                String month = months[index];
                if (paidMonths[month] != true) {
                  selectedMonths.add(month);
                  break;
                }
              }
            }
          });
        }
      }
    } catch (error) {
      debugPrint('Error loading payment status: $error');
    }
  }

  Future<void> _loadYearlySummary() async {
    if (token == null) return;

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/yearly-summary/${widget.studentId}'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        final data =
            responseData is Map ? (responseData['data'] ?? responseData) : {};

        if (_isMounted) {
          setState(() {
            totalPaid = (data['total_paid']?.toDouble() ?? 0.0);
            totalDue = totalYearlyFee - totalPaid;
            if (totalDue < 0) totalDue = 0.0;
            debugPrint(
                'Yearly Summary: totalYearlyFee=$totalYearlyFee, totalPaid=$totalPaid, totalDue=$totalDue');
          });
        }
      }
    } catch (error) {
      debugPrint('Error loading yearly summary: $error');
    }
  }

  void _calculateTotals() {
    if (!_isMounted) return;

    double total = 0.0;

    feeControllers.forEach((feeMasterId, controller) {
      double amount = double.tryParse(controller.text) ?? 0.0;
      var fee = feeStructure.firstWhere(
        (f) => f.feeMasterId == feeMasterId,
        orElse: () => FeeStructureModel(
          feeFieldName: '',
          amount: '0.0',
          isCollectable: false,
          isMandatory: false,
          isMonthly: false,
          isOneTime: false,
          feeMasterId: 0,
        ),
      );

      if (fee.isCollectable) {
        if (fee.isMonthly && !isYearlyPayment) {
          amount *= selectedMonths.length;
        }
        total += amount;
        debugPrint(
            'Adding fee: ${fee.feeFieldName} (ID: $feeMasterId), Amount: $amount');
      }
    });

    double deposit = double.tryParse(depositController.text) ?? 0.0;
    double dueBalance = total - deposit;
    if (dueBalance < 0) dueBalance = 0.0;

    setState(() {
      totalDepositController.text = total.toStringAsFixed(2);
      dueBalanceController.text = dueBalance.toStringAsFixed(2);
      debugPrint(
          'Calculated totals: total=$total, deposit=$deposit, dueBalance=$dueBalance');
    });
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime(2101),
    );
    if (picked != null && picked != selectedDate && _isMounted) {
      setState(() {
        selectedDate = picked;
      });
    }
  }

  void _toggleMonthSelection(String month) {
    if (paidMonths[month] == true) return;
    if (_isMounted) {
      setState(() {
        if (selectedMonths.contains(month)) {
          selectedMonths.remove(month);
        } else {
          selectedMonths.add(month);
        }
        _updateFeeAmounts();
        _calculateTotals();
      });
    }
  }

  void _togglePaymentType(bool value) {
    if (_isMounted) {
      if (value && hasPaidMonthly) {
        // _showErrorSnackBar(
        //     'Cannot select yearly payment as monthly fees have been paid');
        showCustomSnackBar(context,
            'Cannot select yearly payment as monthly fees have been paid',
            backgroundColor: Colors.red);
        return;
      }
      if (!value && hasPaidYearly) {
        showCustomSnackBar(context,
            'Cannot select monthly payment as yearly fee has been paid',
            backgroundColor: Colors.red);
        return;
      }

      setState(() {
        isYearlyPayment = value;
        selectedMonths = isYearlyPayment ? ['Yearly'] : [];
        if (!isYearlyPayment && !hasPaidYearly) {
          final currentMonthIndex = DateTime.now().month - 1;
          for (int i = 0; i < months.length; i++) {
            int index = (currentMonthIndex + i) % months.length;
            String month = months[index];
            if (paidMonths[month] != true) {
              selectedMonths.add(month);
              break;
            }
          }
        }
        _updateFeeAmounts();
        _calculateTotals();
      });
    }
  }

  void _updateFeeAmounts() {
    for (var fee in feeStructure) {
      if (fee.isOneTime &&
          paidFeeMasterIds.contains(fee.feeMasterId.toString())) {
        continue;
      }

      if (feeControllers.containsKey(fee.feeMasterId) && fee.isCollectable) {
        double baseAmount = double.tryParse(fee.amount) ?? 0.0;
        double amount =
            fee.isMonthly && !isYearlyPayment ? (baseAmount / 12) : baseAmount;
        feeControllers[fee.feeMasterId]!.text = amount.toStringAsFixed(2);
      }
    }
  }

  Future<void> _submitFees() async {
    if (!_formKey.currentState!.validate()) return;
    if (token == null) {
      // _showErrorSnackBar('Authentication required');
      showCustomSnackBar(context, 'Authentication required',
          backgroundColor: Colors.red);
      return;
    }
    if (remarkController.text.isEmpty) {
      // _showErrorSnackBar('Please enter a remark');
      showCustomSnackBar(context, 'Please enter a remark',
          backgroundColor: Colors.red);
      return;
    }
    if (!isYearlyPayment && selectedMonths.isEmpty) {
      // _showErrorSnackBar('Please select at least one month');
      showCustomSnackBar(context, 'Please select at least one month',
          backgroundColor: Colors.red);
      return;
    }

    if (_isMounted) {
      setState(() => isLoading = true);
    }

    try {
      List<Map<String, dynamic>> feeItems = [];
      feeControllers.forEach((feeMasterId, controller) {
        double amount = double.tryParse(controller.text) ?? 0.0;
        var fee = feeStructure.firstWhere((f) => f.feeMasterId == feeMasterId);

        if (fee.isOneTime &&
            paidFeeMasterIds.contains(feeMasterId.toString())) {
          return;
        }

        if (amount > 0 && fee.isCollectable) {
          feeItems.add({
            'fee_master_id': feeMasterId,
            'fee_name': fee.feeFieldName,
            'amount': amount,
            'is_monthly': fee.isMonthly,
            'is_yearly': isYearlyPayment,
            'is_one_time': fee.isOneTime,
          });
        }
      });

      if (feeItems.isEmpty) {
        // _showErrorSnackBar('No valid fee items to submit');
        showCustomSnackBar(context, 'No valid fee items to submit',
            backgroundColor: Colors.red);
        return;
      }

      final feeData = {
        'student_id': widget.studentId,
        'student_name': widget.studentName,
        'class_name': widget.studentClass,
        'section': widget.studentSection,
        'fee_months': isYearlyPayment ? ['Yearly'] : selectedMonths,
        'payment_date': DateFormat('yyyy-MM-dd').format(selectedDate),
        'deposit': double.tryParse(depositController.text) ?? 0.0,
        'remark': remarkController.text,
        'is_new_admission': widget.isNewAdmission,
        'is_yearly_payment': isYearlyPayment,
        'fee_items': feeItems,
      };

      final response = await http.post(
        Uri.parse('$baseUrl/api/submit'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(feeData),
      );

      final responseBody = jsonDecode(response.body);
      if (!mounted) return;
      if (response.statusCode == 400) {
        // _showErrorSnackBar(responseBody['message'] ?? 'Invalid data provided');
        showCustomSnackBar(
          context,
          responseBody['message'] ?? 'Invalid data provided',
          backgroundColor: Colors.red,
        );

        return;
      } else if (response.statusCode != 201) {
        throw Exception(
            'Failed to record fee payment: ${response.statusCode} - ${responseBody['message']}');
      }

      // _showSuccessSnackBar('Fee payment recorded successfully');
      showCustomSnackBar(context, 'Fee payment recorded successfully',
          backgroundColor: Colors.green);

      // Navigate to FeeReceiptPage
      if (_isMounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => FeeReceiptPage(
              studentId: widget.studentId,
              studentName: widget.studentName,
              studentClass: widget.studentClass,
              studentSection: widget.studentSection,
              feeMonths: isYearlyPayment ? ['Yearly'] : selectedMonths,
              totalPaid:
                  totalPaid + (double.tryParse(depositController.text) ?? 0.0),
              totalDue:
                  totalDue - (double.tryParse(depositController.text) ?? 0.0),
              depositAmount: double.tryParse(depositController.text) ?? 0.0,
              paymentDate: DateFormat('dd/MM/yyyy').format(selectedDate),
              remark: remarkController.text,
              isYearlyPayment: isYearlyPayment,
              feeItems: feeItems,
            ),
          ),
        );
      }
    } catch (error) {
      // _showErrorSnackBar('Error submitting fees: $error');
      showCustomSnackBar(context, 'Error submitting fees: $error',
          backgroundColor: Colors.red);
    } finally {
      if (_isMounted) {
        setState(() => isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final deepPurpleTheme = Colors.deepPurple.shade700;
    final whiteTheme = Colors.white;

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: CustomAppBar(
        title: 'Fee Collection',
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Card(
                      elevation: 4,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              deepPurpleTheme,
                              Colors.deepPurple.shade700
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Padding(
                          padding: EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.person,
                                      color: whiteTheme, size: 20),
                                  SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Student: ${widget.studentName}',
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: whiteTheme,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 12),
                              Row(
                                children: [
                                  Icon(Icons.school,
                                      color: whiteTheme, size: 20),
                                  SizedBox(width: 8),
                                  Text(
                                    'Class: ${widget.studentClass}',
                                    style: TextStyle(
                                        fontSize: 16, color: whiteTheme),
                                  ),
                                ],
                              ),
                              SizedBox(height: 12),
                              Row(
                                children: [
                                  Icon(Icons.class_,
                                      color: whiteTheme, size: 20),
                                  SizedBox(width: 8),
                                  Text(
                                    'Section: ${widget.studentSection}',
                                    style: TextStyle(
                                        fontSize: 16, color: whiteTheme),
                                  ),
                                ],
                              ),
                              SizedBox(height: 16),
                              Divider(
                                // color: whiteTheme.withOpacity(0.5)
                                color:
                                    whiteTheme.withAlpha((0.7 * 255).round()),
                              ),
                              SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      'Payment Type:',
                                      style: TextStyle(
                                        color: whiteTheme,
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  Container(
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        // color: whiteTheme.withOpacity(0.5)
                                        color: whiteTheme
                                            .withAlpha((0.7 * 255).round()),
                                      ),
                                    ),
                                    child: ToggleButtons(
                                      isSelected: [
                                        !isYearlyPayment,
                                        isYearlyPayment,
                                      ],
                                      onPressed: (index) {
                                        if (index == 1 && hasPaidMonthly) {
                                          return;
                                        }
                                        if (index == 0 && hasPaidYearly) {
                                          return;
                                        }
                                        _togglePaymentType(index == 1);
                                      },
                                      borderColor: Colors.transparent,
                                      selectedBorderColor: Colors.transparent,
                                      fillColor: whiteTheme,
                                      color: whiteTheme,
                                      selectedColor: deepPurpleTheme,
                                      borderRadius: BorderRadius.circular(6),
                                      children: [
                                        Padding(
                                          padding: EdgeInsets.symmetric(
                                              horizontal: 16, vertical: 8),
                                          child: Text(
                                            'Monthly',
                                            style: TextStyle(
                                              color: !isYearlyPayment
                                                  ? deepPurpleTheme
                                                  : whiteTheme
                                                ..withAlpha(((hasPaidMonthly
                                                            ? 0.5
                                                            : 1.0) *
                                                        255)
                                                    .round()),
                                              fontWeight: !isYearlyPayment
                                                  ? FontWeight.bold
                                                  : FontWeight.normal,
                                            ),
                                          ),
                                        ),
                                        Padding(
                                          padding: EdgeInsets.symmetric(
                                              horizontal: 16, vertical: 8),
                                          child: Text(
                                            'Yearly',
                                            style: TextStyle(
                                              color: isYearlyPayment
                                                  ? deepPurpleTheme
                                                  : whiteTheme.withAlpha(
                                                      ((hasPaidMonthly
                                                                  ? 0.5
                                                                  : 1.0) *
                                                              255)
                                                          .round()),
                                              fontWeight: isYearlyPayment
                                                  ? FontWeight.bold
                                                  : FontWeight.normal,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 16),
                              if (!isYearlyPayment && !hasPaidYearly) ...[
                                Text(
                                  'Select Months:',
                                  style: TextStyle(
                                    color: whiteTheme,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                SizedBox(height: 8),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: months.map((month) {
                                    final isPaid = paidMonths[month] == true;
                                    final isSelected =
                                        selectedMonths.contains(month);
                                    return ChoiceChip(
                                      label: Text(month),
                                      selected: isSelected,
                                      onSelected: isPaid
                                          ? null
                                          : (selected) =>
                                              _toggleMonthSelection(month),
                                      selectedColor: whiteTheme,
                                      backgroundColor: isPaid
                                          ? Colors.grey.shade600
                                          : Colors.deepPurple.shade700,
                                      labelStyle: TextStyle(
                                        color: isSelected
                                            ? deepPurpleTheme
                                            : whiteTheme,
                                        fontWeight: isSelected
                                            ? FontWeight.bold
                                            : FontWeight.normal,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                        side: BorderSide(
                                          color: isSelected
                                              ? deepPurpleTheme
                                              : Colors.transparent,
                                          width: 2,
                                        ),
                                      ),
                                      disabledColor: Colors.grey.shade600,
                                    );
                                  }).toList(),
                                ),
                                SizedBox(height: 16),
                              ],
                              InkWell(
                                onTap: () => _selectDate(context),
                                child: Container(
                                  decoration: BoxDecoration(
                                    // color: whiteTheme.withOpacity(0.2),
                                    color: whiteTheme
                                        .withAlpha((0.2 * 255).round()),

                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      // color: whiteTheme.withOpacity(0.3)
                                      color: whiteTheme
                                          .withAlpha((0.3 * 255).round()),
                                    ),
                                  ),
                                  padding: EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 12),
                                  child: Row(
                                    children: [
                                      Icon(Icons.calendar_today,
                                          size: 20, color: whiteTheme),
                                      SizedBox(width: 12),
                                      Text(
                                        'Payment Date: ${DateFormat('dd/MM/yyyy').format(selectedDate)}',
                                        style: TextStyle(
                                            color: whiteTheme, fontSize: 16),
                                      ),
                                      Spacer(),
                                      Icon(
                                        Icons.edit,
                                        size: 18,
                                        // color: whiteTheme.withOpacity(0.7)),
                                        color: whiteTheme
                                            .withAlpha((0.7 * 255).round()),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    SizedBox(height: 24),
                    Card(
                      elevation: 4,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Yearly Fee Summary',
                              style: TextStyle(
                                color: deepPurpleTheme,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Total Yearly Fee:',
                                    style: TextStyle(
                                        fontSize: 16, color: Colors.black87)),
                                Text(
                                  totalYearlyFee == 0.0
                                      ? 'N/A'
                                      : '₹${totalYearlyFee.toStringAsFixed(2)}',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: totalYearlyFee == 0.0
                                        ? Colors.grey.shade600
                                        : deepPurpleTheme,
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Total Paid:',
                                    style: TextStyle(
                                        fontSize: 16, color: Colors.black87)),
                                Text(
                                  totalPaid == 0.0
                                      ? 'N/A'
                                      : '₹${totalPaid.toStringAsFixed(2)}',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: totalPaid == 0.0
                                        ? Colors.grey.shade600
                                        : Colors.green.shade600,
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Total Due:',
                                    style: TextStyle(
                                        fontSize: 16, color: Colors.black87)),
                                Text(
                                  totalYearlyFee > 0 && totalDue == 0.0
                                      ? '₹${(totalYearlyFee - totalPaid).toStringAsFixed(2)}'
                                      : totalDue == 0.0
                                          ? 'N/A'
                                          : '₹${totalDue.toStringAsFixed(2)}',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: totalDue == 0.0 && totalYearlyFee > 0
                                        ? Colors.red.shade600
                                        : totalDue == 0.0
                                            ? Colors.grey.shade600
                                            : Colors.red.shade600,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    SizedBox(height: 24),
                    Card(
                      elevation: 6,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16)),
                      child: Column(
                        children: [
                          ListTile(
                            contentPadding: EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            title: Text(
                              'Fee Details',
                              style: TextStyle(
                                color: whiteTheme,
                                fontWeight: FontWeight.bold,
                                fontSize: 20,
                              ),
                            ),
                            subtitle:
                                !isFeeDetailsExpanded && feeStructure.isNotEmpty
                                    ? Text(
                                        '${feeStructure.length} Fee${feeStructure.length > 1 ? 's' : ''} Available',
                                        style: TextStyle(
                                            color: Colors.deepPurple.shade300,
                                            fontSize: 14),
                                      )
                                    : null,
                            trailing: Icon(
                              isFeeDetailsExpanded
                                  ? Icons.expand_less
                                  : Icons.expand_more,
                              color: whiteTheme,
                              size: 28,
                            ),
                            onTap: () {
                              setState(() {
                                isFeeDetailsExpanded = !isFeeDetailsExpanded;
                              });
                            },
                            tileColor: deepPurpleTheme,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.vertical(
                                top: Radius.circular(16),
                                bottom: isFeeDetailsExpanded
                                    ? Radius.zero
                                    : Radius.circular(16),
                              ),
                            ),
                          ),
                          AnimatedSize(
                            duration: Duration(milliseconds: 300),
                            child: AnimatedOpacity(
                              opacity: isFeeDetailsExpanded ? 1.0 : 0.0,
                              duration: Duration(milliseconds: 200),
                              child: isFeeDetailsExpanded
                                  ? Container(
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.vertical(
                                            bottom: Radius.circular(16)),
                                      ),
                                      child: Padding(
                                        padding: EdgeInsets.all(12),
                                        child: Column(
                                          children: [
                                            if (feeStructure.isEmpty)
                                              Padding(
                                                padding: EdgeInsets.all(16),
                                                child: Text(
                                                  'No fee structure available for this class',
                                                  style: TextStyle(
                                                      color:
                                                          Colors.grey.shade600,
                                                      fontSize: 14),
                                                ),
                                              )
                                            else
                                              ...feeStructure.map((fee) {
                                                if (paidFeeMasterIds.contains(
                                                    fee.feeMasterId
                                                        .toString())) {
                                                  return Container(
                                                    margin: EdgeInsets.only(
                                                        bottom: 12),
                                                    padding: EdgeInsets.all(12),
                                                    decoration: BoxDecoration(
                                                      color:
                                                          Colors.green.shade50,
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              8),
                                                      border: Border.all(
                                                          color: Colors
                                                              .green.shade200),
                                                    ),
                                                    child: Row(
                                                      children: [
                                                        Icon(Icons.check_circle,
                                                            color: Colors
                                                                .green.shade600,
                                                            size: 20),
                                                        SizedBox(width: 8),
                                                        Expanded(
                                                          child: Text(
                                                            '${fee.feeFieldName} - Already Paid',
                                                            style: TextStyle(
                                                              fontSize: 14,
                                                              color: Colors
                                                                  .green
                                                                  .shade700,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w500,
                                                            ),
                                                          ),
                                                        ),
                                                        Text(
                                                          '₹${fee.amount}',
                                                          style: TextStyle(
                                                            fontSize: 14,
                                                            color: Colors
                                                                .green.shade700,
                                                            fontWeight:
                                                                FontWeight.bold,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  );
                                                }

                                                if (!fee.isCollectable ||
                                                    !feeControllers.containsKey(
                                                        fee.feeMasterId)) {
                                                  return SizedBox.shrink();
                                                }

                                                final controller =
                                                    feeControllers[
                                                        fee.feeMasterId]!;
                                                final amount = double.tryParse(
                                                        controller.text) ??
                                                    0.0;
                                                final totalAmount = fee
                                                            .isMonthly &&
                                                        !isYearlyPayment
                                                    ? amount *
                                                        selectedMonths.length
                                                    : amount;

                                                return Container(
                                                  margin: EdgeInsets.only(
                                                      bottom: 12),
                                                  child: Card(
                                                    elevation: 3,
                                                    shape:
                                                        RoundedRectangleBorder(
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              12),
                                                      side: BorderSide(
                                                          color: Colors
                                                              .deepPurple
                                                              .shade50,
                                                          width: 1),
                                                    ),
                                                    color: Colors.white,
                                                    child: ListTile(
                                                      contentPadding:
                                                          EdgeInsets.all(12),
                                                      title: Row(
                                                        children: [
                                                          Icon(
                                                              Icons
                                                                  .currency_rupee,
                                                              size: 18,
                                                              color: Colors
                                                                  .deepPurple
                                                                  .shade600),
                                                          SizedBox(width: 8),
                                                          Expanded(
                                                            child: Text(
                                                              fee.feeFieldName,
                                                              style: TextStyle(
                                                                fontSize: 16,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w600,
                                                                color: Colors
                                                                    .deepPurple
                                                                    .shade800,
                                                              ),
                                                            ),
                                                          ),
                                                          if (fee.isMandatory)
                                                            Container(
                                                              padding: EdgeInsets
                                                                  .symmetric(
                                                                      horizontal:
                                                                          6,
                                                                      vertical:
                                                                          2),
                                                              decoration:
                                                                  BoxDecoration(
                                                                color: Colors
                                                                    .red
                                                                    .shade600,
                                                                borderRadius:
                                                                    BorderRadius
                                                                        .circular(
                                                                            4),
                                                              ),
                                                              child: Text(
                                                                'Required',
                                                                style:
                                                                    TextStyle(
                                                                  color: Colors
                                                                      .white,
                                                                  fontSize: 10,
                                                                  fontWeight:
                                                                      FontWeight
                                                                          .bold,
                                                                ),
                                                              ),
                                                            ),
                                                          if (fee.isMonthly)
                                                            Padding(
                                                              padding: EdgeInsets
                                                                  .only(
                                                                      left: 8),
                                                              child: Chip(
                                                                label: Text(
                                                                  isYearlyPayment
                                                                      ? 'Yearly'
                                                                      : 'Monthly',
                                                                  style: TextStyle(
                                                                      fontSize:
                                                                          11,
                                                                      color: Colors
                                                                          .white),
                                                                ),
                                                                backgroundColor:
                                                                    Colors
                                                                        .deepPurple
                                                                        .shade600,
                                                                padding: EdgeInsets
                                                                    .symmetric(
                                                                        horizontal:
                                                                            6),
                                                                labelPadding:
                                                                    null,
                                                              ),
                                                            ),
                                                          if (fee.isOneTime)
                                                            Padding(
                                                              padding: EdgeInsets
                                                                  .only(
                                                                      left: 8),
                                                              child: Chip(
                                                                label: Text(
                                                                  'One-Time',
                                                                  style: TextStyle(
                                                                      fontSize:
                                                                          11,
                                                                      color: Colors
                                                                          .white),
                                                                ),
                                                                backgroundColor:
                                                                    Colors
                                                                        .purple
                                                                        .shade600,
                                                                padding: EdgeInsets
                                                                    .symmetric(
                                                                        horizontal:
                                                                            6),
                                                                labelPadding:
                                                                    null,
                                                              ),
                                                            ),
                                                        ],
                                                      ),
                                                      subtitle: Column(
                                                        crossAxisAlignment:
                                                            CrossAxisAlignment
                                                                .start,
                                                        children: [
                                                          SizedBox(height: 8),
                                                          Text(
                                                            'Base: ₹${amount.toStringAsFixed(2)} ${fee.isMonthly ? (isYearlyPayment ? '/year' : '/month') : ''}',
                                                            style: TextStyle(
                                                                fontSize: 13,
                                                                color: Colors
                                                                    .grey
                                                                    .shade600),
                                                          ),
                                                          if (fee.isMonthly)
                                                            Text(
                                                              isYearlyPayment
                                                                  ? 'Total (1 year): ₹${totalAmount.toStringAsFixed(2)}'
                                                                  : 'Total (${selectedMonths.length} month${selectedMonths.length > 1 ? 's' : ''}): ₹${totalAmount.toStringAsFixed(2)}',
                                                              style: TextStyle(
                                                                fontSize: 13,
                                                                color: Colors
                                                                    .green
                                                                    .shade600,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w600,
                                                              ),
                                                            ),
                                                          SizedBox(height: 12),
                                                        ],
                                                      ),
                                                    ),
                                                  ),
                                                );
                                              }),
                                          ],
                                        ),
                                      ),
                                    )
                                  : SizedBox.shrink(),
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: 24),
                    Text(
                      'Payment Summary',
                      style: TextStyle(
                        color: deepPurpleTheme,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 12),
                    Card(
                      elevation: 4,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: Column(
                          children: [
                            _buildSummaryField(
                              controller: totalDepositController,
                              label: 'Total Amount',
                              icon: Icons.account_balance_wallet,
                              isEditable: false,
                            ),
                            SizedBox(height: 16),
                            _buildSummaryField(
                              controller: depositController,
                              label: 'Deposit Amount*',
                              icon: Icons.payments,
                              isEditable: true,
                              isRequired: true,
                            ),
                            SizedBox(height: 16),
                            _buildSummaryField(
                              controller: dueBalanceController,
                              label: 'Due Balance',
                              icon: Icons.account_balance,
                              isEditable: false,
                            ),
                            SizedBox(height: 16),
                            _buildRemarkField(),
                          ],
                        ),
                      ),
                    ),
                    SizedBox(height: 32),
                    SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: CustomButton(
                          text: 'Submit Fee Payment',
                          onPressed: isLoading ? null : _submitFees,
                          icon: Icons.save_alt,
                          isLoading: isLoading,
                          height: 50,
                          width: double.infinity,
                        )),
                    SizedBox(height: 16),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSummaryField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    required bool isEditable,
    bool isRequired = false,
  }) {
    return TextFormField(
      controller: controller,
      enabled: isEditable,
      decoration: InputDecoration(
        labelText: label + (isRequired ? '*' : ''),
        labelStyle: TextStyle(
          color: isEditable ? Colors.deepPurple.shade600 : Colors.grey.shade600,
          fontSize: 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.deepPurple.shade100),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.deepPurple.shade100),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.deepPurple.shade600, width: 2),
        ),
        prefixIcon: Icon(
          icon,
          color: isEditable ? Colors.deepPurple.shade600 : Colors.grey.shade600,
          size: 20,
        ),
        filled: true,
        fillColor:
            isEditable ? Colors.deepPurple.shade50 : Colors.grey.shade100,
      ),
      style: TextStyle(
        color: isEditable ? Colors.black : Colors.grey.shade700,
        fontWeight: isEditable ? FontWeight.normal : FontWeight.bold,
        fontSize: 14,
      ),
      keyboardType: TextInputType.number,
      validator: isRequired
          ? (value) {
              if (value == null || value.isEmpty) return 'Please enter amount';
              double? deposit = double.tryParse(value);
              if (deposit == null) return 'Please enter a valid number';
              double total = double.tryParse(totalDepositController.text) ?? 0;
              if (deposit > total) {
                return 'Deposit cannot be greater than total amount';
              }
              return null;
            }
          : null,
    );
  }

  Widget _buildRemarkField() {
    return TextFormField(
      controller: remarkController,
      decoration: InputDecoration(
        labelText: 'Remark*',
        labelStyle: TextStyle(color: Colors.deepPurple.shade600, fontSize: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.deepPurple.shade100),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.deepPurple.shade100),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.deepPurple.shade600, width: 2),
        ),
        prefixIcon: Icon(Icons.note, color: Colors.deepPurple.shade600),
        filled: true,
        fillColor: Colors.deepPurple.shade50,
      ),
      style: TextStyle(fontSize: 14, color: Colors.black87),
      maxLines: 2,
      validator: (value) =>
          value == null || value.isEmpty ? 'Please enter a remark' : null,
    );
  }
}

class FeeStructureModel {
  final String feeFieldName;
  final String amount;
  final bool isCollectable;
  final bool isMandatory;
  final bool isMonthly;
  final bool isOneTime;
  final int feeMasterId;

  FeeStructureModel({
    required this.feeFieldName,
    required this.amount,
    required this.isCollectable,
    required this.isMandatory,
    required this.isMonthly,
    required this.isOneTime,
    required this.feeMasterId,
  });

  static bool parseBool(dynamic val) {
    debugPrint('Parsing bool value: $val');
    if (val == null) return false;
    if (val is bool) return val;
    if (val is String) {
      final lower = val.toLowerCase();
      return lower == 't' || lower == 'true' || lower == '1';
    }
    if (val is num) return val == 1;
    return false;
  }

  factory FeeStructureModel.fromJson(Map<String, dynamic> json) {
    debugPrint('Input JSON for fee: ${jsonEncode(json)}');

    String amountStr = '0.0';
    if (json['amount'] != null) {
      amountStr = json['amount'] is num
          ? json['amount'].toString()
          : json['amount'].toString().trim();
    }

    bool isOneTime = parseBool(json['is_one_time']); // Updated key
    bool isMonthly = parseBool(json['is_monthly']); // Updated key

    // Fallback to frequency if is_one_time/is_monthly are missing
    if (json['is_one_time'] == null && json['frequency'] != null) {
      final frequency = json['frequency'].toString().toLowerCase();
      isOneTime = frequency == 'onetime' ||
          frequency == 'one-time' ||
          frequency == 'one_time';
      isMonthly = frequency == 'monthly';
      if (frequency == 'yearly') {
        isOneTime =
            json['fee_field_name']?.toString().toLowerCase() == 'transport fee';
        isMonthly = !isOneTime;
      }
      debugPrint(
          'Inferred from frequency "$frequency": isOneTime=$isOneTime, isMonthly=$isMonthly');
    }

    debugPrint(
      'Parsing fee: ${json['fee_field_name']}, '
      'isOneTime=$isOneTime, '
      'isMonthly=$isMonthly, '
      'fee_master_id=${json['fee_master_id']}',
    );

    return FeeStructureModel(
      feeFieldName: json['fee_field_name']?.toString() ?? '',
      amount: amountStr,
      isCollectable: parseBool(json['is_collectable']),
      isMandatory:
          parseBool(json['is_mandatory'] ?? json['installments_allowed']),
      isMonthly: isMonthly,
      isOneTime: isOneTime,
      feeMasterId: json['fee_master_id'] is int
          ? json['fee_master_id']
          : int.tryParse(json['fee_master_id'].toString()) ?? 0,
    );
  }

  @override
  String toString() {
    return 'FeeStructureModel(feeFieldName: $feeFieldName, amount: $amount, isCollectable: $isCollectable, isMandatory: $isMandatory, isMonthly: $isMonthly, isOneTime: $isOneTime, feeMasterId: $feeMasterId)';
  }
}
