import 'package:flutter/material.dart';
import 'package:sms/pages/services/subject_service.dart';
import 'package:sms/pages/subjects/class_with_subjects.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';

class EditSubjectsPage extends StatefulWidget {
  final ClassWithSubjects classData;
  final String token;

  const EditSubjectsPage({
    super.key,
    required this.classData,
    required this.token,
  });

  @override
  State<EditSubjectsPage> createState() => _EditSubjectsPageState();
}

class _EditSubjectsPageState extends State<EditSubjectsPage> {
  late List<TextEditingController> subjectControllers;
  late List<TextEditingController> marksControllers;
  late List<String> subjectIds;
  bool isSaving = false;
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _initializeControllers();
  }

  void _initializeControllers() {
    subjectControllers = [];
    marksControllers = [];
    subjectIds = [];

    for (var subject in widget.classData.subjects) {
      subjectControllers.add(TextEditingController(text: subject.subjectName));
      marksControllers.add(TextEditingController(text: subject.marks));
      subjectIds.add(subject.id);
    }

    if (subjectControllers.isEmpty) {
      subjectControllers.add(TextEditingController());
      marksControllers.add(TextEditingController());
      subjectIds.add(''); // Empty ID for new subjects
    }
  }

  Future<void> _addSubject() async {
    setState(() {
      subjectControllers.add(TextEditingController());
      marksControllers.add(TextEditingController());
      subjectIds.add(''); // Empty ID for new subjects
    });
  }

  void _removeSubject(int index) async {
    final subjectId = subjectIds[index];

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Delete Subject'),
        content: Text('Are you sure you want to delete this subject?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    if (subjectId.isNotEmpty) {
      try {
        final success = await SubjectService.deleteSingleSubject(subjectId);
        if (!mounted) return;
        if (!success) {
          showCustomSnackBar(context, 'Failed to delete subject from server',
              backgroundColor: Colors.red);
          return;
        } else {
          showCustomSnackBar(context, 'Subject deleted successfully',
              backgroundColor: Colors.red);
        }
      } catch (e) {
        if (!mounted) return;
        showCustomSnackBar(context, 'Error deleting subject: ${e.toString()}',
            backgroundColor: Colors.red);
        return;
      }
    }
    // remove from UI after backend deletion
    setState(() {
      subjectControllers.removeAt(index);
      marksControllers.removeAt(index);
      subjectIds.removeAt(index);
    });
  }

  Future<void> _saveChanges() async {
    if (!_formKey.currentState!.validate()) return;

    if (widget.classData.id.isEmpty) {
      showCustomSnackBar(context, 'Error: Class ID is missing',
          backgroundColor: Colors.red);
      return;
    }

    setState(() {
      isSaving = true;
    });

    try {
      List<Map<String, dynamic>> subjectsData = [];
      for (int i = 0; i < subjectControllers.length; i++) {
        subjectsData.add({
          'id': subjectIds[i].isEmpty
              ? null
              : subjectIds[i], // Send null for new subjects
          'subject_name': subjectControllers[i].text.trim(),
          'marks': marksControllers[i].text.trim(),
        });
      }

      bool success = await SubjectService.updateSubjects(
        classId: widget.classData.id,
        subjectsData: subjectsData,
      );
      if (!mounted) return;
      if (success) {
        showCustomSnackBar(context, 'Subjects updated successfully!',
            backgroundColor: Colors.green);
        Navigator.pop(context, true);
      } else {
        showCustomSnackBar(context, 'Failed to update subjects',
            backgroundColor: Colors.red);
      }
    } catch (e) {
      showCustomSnackBar(context, 'An error occurred: ${e.toString()}',
          backgroundColor: Colors.red);
    } finally {
      setState(() {
        isSaving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(
        title: ('Edit Subjects'),
      ),
      body: isSaving
          ? Center(
              child: CircularProgressIndicator(
                valueColor:
                    AlwaysStoppedAnimation<Color>(Colors.deepPurple[800]!),
              ),
            )
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          ' ${widget.classData.className}',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.deepPurple[900],
                          ),
                        ),
                        IconButton(
                          onPressed: _addSubject,
                          icon: Icon(
                            Icons.add_circle,
                            color: Colors.deepPurple,
                            size: 28,
                          ),
                          tooltip: 'Add Subject',
                        ),
                      ],
                    ),
                    SizedBox(height: 16),
                    Expanded(
                      child: ListView.separated(
                        itemCount: subjectControllers.length,
                        separatorBuilder: (_, __) => SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          return Card(
                            elevation: 2,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Padding(
                              padding: EdgeInsets.all(12),
                              child: Column(
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        'Subject ${index + 1}',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: Colors.deepPurple[800],
                                        ),
                                      ),
                                      Spacer(),
                                      if (subjectControllers.isNotEmpty)
                                        IconButton(
                                          icon: Icon(Icons.delete,
                                              color: Colors.red[400]),
                                          onPressed: () =>
                                              _removeSubject(index),
                                        ),
                                    ],
                                  ),
                                  SizedBox(height: 10),
                                  TextFormField(
                                    controller: subjectControllers[index],
                                    decoration: InputDecoration(
                                      labelText: 'Subject Name',
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Required';
                                      }
                                      return null;
                                    },
                                  ),
                                  SizedBox(height: 10),
                                  TextFormField(
                                    controller: marksControllers[index],
                                    keyboardType: TextInputType.number,
                                    decoration: InputDecoration(
                                      labelText: 'Marks',
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Required';
                                      }
                                      if (int.tryParse(value) == null) {
                                        return 'Invalid number';
                                      }
                                      return null;
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
                      child: Padding(
                        padding: const EdgeInsets.only(top: 16),
                        child: CustomButton(
                          text: 'Save',
                          icon: Icons.save_alt,
                          onPressed: isSaving ? null : _saveChanges,
                          width: 160,
                          height: 45,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  @override
  void dispose() {
    for (var controller in subjectControllers) {
      controller.dispose();
    }
    for (var controller in marksControllers) {
      controller.dispose();
    }
    super.dispose();
  }
}
