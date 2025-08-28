import 'package:flutter/material.dart';
import 'package:sms/pages/fees/fee_structure.dart';
import 'package:sms/pages/services/feemaster_service.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';

class FeeMasterPage extends StatefulWidget {
  const FeeMasterPage({super.key});

  @override
  FeeMasterPageState createState() => FeeMasterPageState();
}

class FeeMasterPageState extends State<FeeMasterPage> {
  final _formKey = GlobalKey<FormState>();
  List<FeeField> feeFields = [];

  @override
  void initState() {
    super.initState();
    _addFeeField(); // Start with one field
  }

  void _addFeeField() {
    setState(() {
      feeFields.add(FeeField());
    });
  }

  void _removeFeeField(int index) {
    if (feeFields.length > 1) {
      setState(() {
        feeFields.removeAt(index);
      });
    }
  }

  void _submitForm() async {
    if (_formKey.currentState!.validate()) {
      final List<Map<String, dynamic>> feeData = feeFields.map((field) {
        return {
          'fee_name': field.feeName.trim(),
          'is_one_time': field.isOneTime,
          'is_common_for_all_classes': field.isCommonForAllClasses,
          'amount': field.isCommonForAllClasses ? field.amount : null,
        };
      }).toList();

      final result = await FeeMasterService.submitFeeFields(feeData);
      final success = result['success'];
      final message = result['message'] ?? 'Something went wrong';

      if (!mounted) return;

      showCustomSnackBar(
        context,
        message,
        backgroundColor: success ? Colors.green : Colors.red,
      );

      if (success) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => FeeStructurePage(),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: 'Fee Master'),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // 🔴 Red warning message
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  border: Border.all(color: Colors.red),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.warning_amber_rounded, color: Colors.red),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'You can create fee fields only once per session. Please review carefully before proceeding.',
                        style: TextStyle(
                          color: Colors.red,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Define Fee Fields',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.deepPurple,
                    ),
                  ),
                  IconButton(
                    onPressed: _addFeeField,
                    icon: Icon(Icons.add_circle,
                        color: Colors.deepPurple, size: 28),
                    tooltip: 'Add Fee Field',
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ListView.separated(
                  itemCount: feeFields.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    return Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                Text(
                                  'Fee ${index + 1}',
                                  style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.deepPurple),
                                ),
                                const Spacer(),
                                if (feeFields.length > 1)
                                  IconButton(
                                    icon: Icon(Icons.delete,
                                        color: Colors.red[400]),
                                    onPressed: () => _removeFeeField(index),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              decoration: InputDecoration(
                                labelText: 'Fee Name',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'Please enter a fee name';
                                }
                                return null;
                              },
                              onChanged: (value) {
                                feeFields[index].feeName = value;
                              },
                            ),
                            const SizedBox(height: 10),
                            CheckboxListTile(
                              title: const Text("Is One Time?"),
                              value: feeFields[index].isOneTime,
                              onChanged: (val) {
                                setState(() {
                                  feeFields[index].isOneTime = val ?? false;
                                });
                              },
                            ),
                            CheckboxListTile(
                              title: const Text("Same for All Classes?"),
                              value: feeFields[index].isCommonForAllClasses,
                              onChanged: (val) {
                                setState(() {
                                  feeFields[index].isCommonForAllClasses =
                                      val ?? false;
                                });
                              },
                            ),
                            if (feeFields[index].isCommonForAllClasses)
                              TextFormField(
                                decoration: InputDecoration(
                                  labelText: 'Amount (Same for All Classes)',
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                keyboardType: TextInputType.numberWithOptions(
                                    decimal: true),
                                validator: (value) {
                                  if (feeFields[index].isCommonForAllClasses &&
                                      (value == null || value.trim().isEmpty)) {
                                    return 'Please enter the amount';
                                  }
                                  return null;
                                },
                                onChanged: (value) {
                                  feeFields[index].amount =
                                      double.tryParse(value) ?? 0.0;
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
                  text: 'Submit',
                  icon: Icons.save_alt,
                  onPressed: _submitForm,
                  width: 130,
                  height: 45,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// FeeField model
class FeeField {
  String feeName = '';
  bool isOneTime = false;
  bool isCommonForAllClasses = false;
  double? amount;
}
