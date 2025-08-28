import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
// import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:sms/pages/principle/principle_dashboard.dart';
import 'package:sms/pages/services/fee_structure_service.dart';
import 'package:sms/pages/services/feemaster_service.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';
import 'package:sms/widgets/class_section_selector.dart';

class FeeStructurePage extends StatefulWidget {
  const FeeStructurePage({super.key});

  @override
  State<FeeStructurePage> createState() => _FeeStructurePageState();
}

class _FeeStructurePageState extends State<FeeStructurePage> {
  String? token;
  ClassModel? selectedClass;
  List<FeeField> feeFields = [];
  bool isLoading = false;
  // static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  @override
  void initState() {
    super.initState();
    _loadToken();
  }

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      token = prefs.getString('token');
    });
    if (token != null) {
      await _loadFeeFields();
    }
  }

  Future<void> _loadFeeFields() async {
    try {
      final fetchedFields = await FeeMasterService.getFeeFields();
      if (!mounted) return;
      setState(() {
        feeFields = fetchedFields.map((field) {
          final amount = field['amount'] != null
              ? double.tryParse(field['amount'].toString())
              : null;
          final isCommon = field['is_common_for_all_classes'] ?? false;

          return FeeField(
            label: field['fee_field_name'] ?? 'Unnamed Fee',
            id: field['id']?.toString() ?? '0',
            defaultAmount: amount,
            isCommonForAll: isCommon,
          );
        }).toList();
      });
    } catch (e) {
      showCustomSnackBar(context, "Error loading fee fields: ${e.toString()}",
          backgroundColor: Colors.red);
    }
  }

  void _saveFeeStructure() async {
    if (selectedClass == null) {
      showCustomSnackBar(context, "Please select a class",
          backgroundColor: Colors.red);
      return;
    }

    List<Map<String, dynamic>> feeStructure = [];

    for (var field in feeFields) {
      if (field.amountController.text.isEmpty) {
        showCustomSnackBar(context, "Please enter amount for ${field.label}",
            backgroundColor: Colors.red);
        return;
      }

      feeStructure.add({
        'fee_master_id': int.parse(field.id),
        'amount': double.parse(field.amountController.text),
        'is_collectable': field.isCollectable,
      });
    }

    setState(() => isLoading = true);

    try {
      // Now submitFeeStructure returns FeeStructureResponse instead of bool
      final response = await FeeStructureService.submitFeeStructure(
        classId: selectedClass!.id.toString(),
        structure: feeStructure,
      );

      if (!mounted) return;

      showCustomSnackBar(
        context,
        response.message, // Show backend message here
        backgroundColor: response.success ? Colors.green : Colors.red,
      );

      if (response.success) {
        Future.delayed(const Duration(milliseconds: 500), () {
          if (!mounted) return;
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => const PrincipleDashboard(),
            ),
          );
        });
      }
    } catch (e) {
      if (!mounted) return;
      showCustomSnackBar(
        context,
        "Error saving Fee Structure: ${e.toString()}",
        backgroundColor: Colors.red,
      );
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Fee Structure',
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.red.shade100,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade700),
                    ),
                    child: Row(
                      children: const [
                        Icon(Icons.warning, color: Colors.red),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Warning: You can create the fee structure for a class only once per session. Please proceed carefully.',
                            style: TextStyle(
                              color: Colors.red,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  ClassSectionSelector(
                    onSelectionChanged: (ClassModel? cls, String? sec) {
                      setState(() {
                        selectedClass = cls;
                      });
                    },
                    initialClass: selectedClass,
                    showSectionDropdown: false, // Hide section dropdown
                  ),
                  const SizedBox(height: 20),
                  Expanded(
                    child: ListView.builder(
                      itemCount: feeFields.length,
                      itemBuilder: (context, index) {
                        final field = feeFields[index];
                        return Card(
                          elevation: 2,
                          margin: const EdgeInsets.symmetric(vertical: 8),
                          child: Padding(
                            padding: const EdgeInsets.all(12.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(field.label,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold)),
                                const SizedBox(height: 10),
                                TextField(
                                  controller: field.amountController,
                                  keyboardType: TextInputType.number,
                                  readOnly: field.isCommonForAll &&
                                      field.defaultAmount != null,
                                  decoration: InputDecoration(
                                    labelText: field.isCommonForAll
                                        ? 'Fixed Amount (from Fee Master)'
                                        : 'Amount',
                                    border: const OutlineInputBorder(),
                                    suffixIcon: field.isCommonForAll
                                        ? const Icon(Icons.lock,
                                            color: Colors.grey)
                                        : null,
                                  ),
                                ),
                                if (!field.isCommonForAll)
                                  CheckboxListTile(
                                    title: const Text('Not Collectable'),
                                    value: !field.isCollectable,
                                    onChanged: (value) {
                                      setState(() {
                                        field.isCollectable = !value!;
                                      });
                                    },
                                  ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  Align(
                    alignment: Alignment.centerRight,
                    child: CustomButton(
                      text: 'Save',
                      icon: Icons.save_alt,
                      onPressed: _saveFeeStructure,
                      width: 130,
                      height: 45,
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

class FeeField {
  final String label;
  final String id;
  final double? defaultAmount;
  final bool isCommonForAll;
  final TextEditingController amountController = TextEditingController();
  bool isCollectable = true;

  FeeField({
    required this.label,
    required this.id,
    this.defaultAmount,
    this.isCommonForAll = false,
  }) {
    if (defaultAmount != null) {
      amountController.text = defaultAmount.toString();
    }
  }
}
