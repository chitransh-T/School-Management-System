import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/pages/services/subject_service.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';
import 'package:sms/widgets/class_section_selector.dart';

class AssignSubjectPage extends StatefulWidget {
  const AssignSubjectPage({super.key});

  @override
  State<AssignSubjectPage> createState() => _AssignSubjectPageState();
}

class _AssignSubjectPageState extends State<AssignSubjectPage> {
  final _formKey = GlobalKey<FormState>();
  List<SubjectField> subjectFields = [SubjectField()];
  bool isLoading = false;
  ClassModel? selectedClass;
  String? selectedSection;

  @override
  void initState() {
    super.initState();
    _loadToken();
  }

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) {
      if (!mounted) return;
      showCustomSnackBar(context, 'No token, please login.',
          backgroundColor: Colors.red);
    }
  }

  void _addSubjectField() {
    setState(() => subjectFields.add(SubjectField()));
  }

  void _removeSubjectField(int index) {
    if (subjectFields.length > 1) {
      setState(() => subjectFields.removeAt(index));
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    if (selectedClass == null) {
      showCustomSnackBar(context, 'Please select class',
          backgroundColor: Colors.red);
      return;
    }

    setState(() => isLoading = true);

    final subjectData = subjectFields
        .map((f) => {
              'subject_name': f.subjectName.trim(),
              'marks': f.marks.trim(),
            })
        .toList();

    try {
      final success = await SubjectService.registerSubject(
        classId: selectedClass!.id,
        subjectsData: subjectData,
      );
      if (!mounted) return;
      showCustomSnackBar(
        context,
        success
            ? 'Subjects assigned successfully!'
            : 'Failed to assign subjects',
        backgroundColor: success ? Colors.green : Colors.red,
      );

      if (success) {
        setState(() {
          subjectFields.clear();
          subjectFields.add(SubjectField());
          selectedClass = null;
          selectedSection = null;
          _formKey.currentState!.reset();
        });
      }
    } catch (e) {
      showCustomSnackBar(
        context,
        e.toString().replaceAll('Exception: ', ''),
        backgroundColor: Colors.red,
      );
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(title: 'Assign Subjects'),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Assign Subjects',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.deepPurple,
                      ),
                    ),
                    IconButton(
                      onPressed: _addSubjectField,
                      icon: const Icon(Icons.add_circle,
                          color: Colors.deepPurple, size: 28),
                      tooltip: 'Add Subject',
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ClassSectionSelector(
                  onSelectionChanged: (ClassModel? cls, String? sec) {
                    setState(() {
                      selectedClass = cls;
                      // selectedSection = sec;
                      if (cls == null) {
                        subjectFields = [SubjectField()];
                      }
                    });
                  },
                  initialClass: selectedClass,
                  // initialSection: selectedSection,
                  showSectionDropdown: false,
                ),
                const SizedBox(height: 16),
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: subjectFields.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    return Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                Text(
                                  'Subject ${index + 1}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.deepPurple,
                                  ),
                                ),
                                const Spacer(),
                                if (subjectFields.length > 1)
                                  IconButton(
                                    icon: Icon(Icons.delete,
                                        color: Colors.red[400]),
                                    onPressed: () => _removeSubjectField(index),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            TextFormField(
                              decoration: _inputDecoration('Subject Name'),
                              validator: (v) => v == null || v.trim().isEmpty
                                  ? 'Required'
                                  : null,
                              onChanged: (val) =>
                                  subjectFields[index].subjectName = val,
                            ),
                            const SizedBox(height: 10),
                            TextFormField(
                              decoration: _inputDecoration('Marks'),
                              keyboardType: TextInputType.number,
                              validator: (v) {
                                if (v == null || v.trim().isEmpty) {
                                  return 'Required';
                                }
                                if (int.tryParse(v) == null) {
                                  return 'Enter valid number';
                                }
                                return null;
                              },
                              onChanged: (val) =>
                                  subjectFields[index].marks = val,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerRight,
                  child: CustomButton(
                    text: 'Save',
                    icon: Icons.save_alt,
                    onPressed: _submitForm,
                    width: 150,
                    height: 45,
                    isLoading: isLoading,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
    );
  }
}

class SubjectField {
  String subjectName = '';
  String marks = '';
}
