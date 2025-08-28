import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';
import 'package:sms/pages/services/subject_service.dart';

class ViewTeacherAssignmentsPage extends StatefulWidget {
  const ViewTeacherAssignmentsPage({super.key});

  @override
  State<ViewTeacherAssignmentsPage> createState() =>
      _ViewTeacherAssignmentsPageState();
}

class _ViewTeacherAssignmentsPageState
    extends State<ViewTeacherAssignmentsPage> {
  bool isLoading = true;
  String? token;
  List<TeacherAssignment> assignments = [];

  static final String baseUrl =
      dotenv.env['NEXT_PUBLIC_API_BASE_URL']?.trim() ?? '';

  @override
  void initState() {
    super.initState();
    _loadTokenAndFetchAssignments();
  }

  Future<void> _loadTokenAndFetchAssignments() async {
    final prefs = await SharedPreferences.getInstance();
    token = prefs.getString('token');
    if (token != null) {
      await fetchAssignments();
    } else {
      _showError('No token found. Please login again.');
    }
  }

  Future<void> fetchAssignments() async {
    setState(() => isLoading = true);
    try {
      final resp = await http.get(
        Uri.parse('$baseUrl/api/teacher-assignments'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (resp.statusCode == 200) {
        final Map<String, dynamic> decoded = json.decode(resp.body);
        final List<dynamic> rawData = decoded['data'] ?? [];

        Map<String, TeacherAssignment> grouped = {};

        for (var e in rawData) {
          final teacherId = e['teacher_id'].toString();
          final teacherName = e['teacher_name'] ?? 'Unknown';
          final classId = e['class_id'].toString();
          final className = e['class_name'] ?? 'Unknown';
          final section = e['section'] ?? 'Unknown';
          final subjectName = e['subject_name'] ?? '';
          final assignmentId = e['id'].toString();

          final key = '$teacherId|$classId|$section';

          if (!grouped.containsKey(key)) {
            grouped[key] = TeacherAssignment(
              id: assignmentId,
              teacherId: teacherId,
              teacherName: teacherName,
              classId: classId,
              className: className,
              section: section,
              subjects: <String>{}, // Use Set to avoid duplicates
            );
          }

          // Add subject to Set (automatically handles duplicates)
          if (subjectName.isNotEmpty) {
            grouped[key]!.subjects.add(subjectName);
          }
        }

        setState(() {
          assignments = grouped.values.toList();
        });
      } else {
        _showError('Failed to load assignments. (${resp.statusCode})');
      }
    } catch (e) {
      _showError('Error: $e');
    } finally {
      setState(() => isLoading = false);
    }
  }

  Future<void> deleteAssignment(TeacherAssignment assignment) async {
    final confirm = await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Confirm Delete'),
        content: Text(
            'Are you sure you want to delete ${assignment.teacherName}\'s assignment?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      final resp = await http.delete(
        Uri.parse('$baseUrl/api/teacher-assignment/${assignment.id}'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (resp.statusCode == 200) {
        _showSuccess('Deleted successfully.');
        await fetchAssignments();
      } else {
        _showError('Failed to delete. (${resp.statusCode})');
      }
    } catch (e) {
      _showError('Delete error: $e');
    }
  }

  void _editAssignment(TeacherAssignment assignment) async {
    // Show loading indicator
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(),
      ),
    );

    try {
      // Fetch available teachers and subjects for this class
      final teachers = await _fetchAvailableTeachers();
      final subjects = await _fetchSubjectsForClass(assignment.classId);
      if (!mounted) return;
      // Close loading dialog
      Navigator.pop(context);

      // Show edit dialog
      showDialog(
        context: context,
        builder: (context) => EditAssignmentDialog(
          assignment: assignment,
          availableTeachers: teachers,
          availableSubjects: subjects,
          onUpdate: (updatedAssignment) {
            // Refresh the assignments list
            fetchAssignments();
          },
        ),
      );
    } catch (e) {
      // Close loading dialog
      Navigator.pop(context);
      _showError('Error loading data: $e');
    }
  }

  Future<List<Teacher>> _fetchAvailableTeachers() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/teachers'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as List;
        return data
            .map((teacher) => Teacher(
                  id: teacher['id'].toString(),
                  name: teacher['teacher_name'] ?? 'Unknown',
                ))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching teachers: $e');
      return [];
    }
  }

  Future<List<Subject>> _fetchSubjectsForClass(String classId) async {
    try {
      final data = await SubjectService.fetchClassesWithSubjects();

      final classIdInt = int.tryParse(classId);
      if (classIdInt == null) return [];

      final cls = data.firstWhere(
        (e) => int.tryParse(e['id'].toString()) == classIdInt,
        orElse: () => {},
      );

      List<Subject> subjects = [];

      if (cls.isNotEmpty && cls['subjects'] is List) {
        final List<dynamic> subjectList = cls['subjects'];
        for (var subJson in subjectList) {
          final id = subJson['id'].toString();
          final names = subJson['subject_name'];
          final splitted = names is String ? names.split(',') : ['Unknown'];

          for (var sub in splitted) {
            final trimmed = sub.trim();
            if (trimmed.isNotEmpty) {
              subjects.add(Subject(
                id: id,
                name: trimmed,
                maxMarks: '0',
              ));
            }
          }
        }
      }

      return subjects;
    } catch (e) {
      debugPrint('Error fetching subjects: $e');
      return [];
    }
  }

  void _showError(String msg) =>
      showCustomSnackBar(context, msg, backgroundColor: Colors.red);
  void _showSuccess(String msg) =>
      showCustomSnackBar(context, msg, backgroundColor: Colors.green);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(title: 'View Assigned Teachers'),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : assignments.isEmpty
              ? const Center(child: Text('No assignments found.'))
              : ListView.builder(
                  itemCount: assignments.length,
                  itemBuilder: (context, index) {
                    final assignment = assignments[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 8),
                      child: ListTile(
                        title: Text(assignment.teacherName),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                                'Class: ${assignment.className} - ${assignment.section}'),
                            Text('Subjects: ${assignment.subjects.join(', ')}'),
                          ],
                        ),
                        trailing: PopupMenuButton<String>(
                          onSelected: (value) {
                            if (value == 'edit') {
                              _editAssignment(assignment);
                            } else if (value == 'delete') {
                              deleteAssignment(assignment);
                            }
                          },
                          itemBuilder: (context) => [
                            const PopupMenuItem(
                                value: 'edit', child: Text('Edit')),
                            const PopupMenuItem(
                                value: 'delete', child: Text('Delete')),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}

class EditAssignmentDialog extends StatefulWidget {
  final TeacherAssignment assignment;
  final List<Teacher> availableTeachers;
  final List<Subject> availableSubjects;
  final Function(TeacherAssignment) onUpdate;

  const EditAssignmentDialog({
    super.key,
    required this.assignment,
    required this.availableTeachers,
    required this.availableSubjects,
    required this.onUpdate,
  });

  @override
  State<EditAssignmentDialog> createState() => _EditAssignmentDialogState();
}

class _EditAssignmentDialogState extends State<EditAssignmentDialog> {
  String? selectedTeacherId;
  Set<String> selectedSubjects = <String>{}; // Use Set instead of List
  bool isLoading = false;

  static final String baseUrl =
      dotenv.env['NEXT_PUBLIC_API_BASE_URL']?.trim() ?? '';

  @override
  void initState() {
    super.initState();
    selectedTeacherId = widget.assignment.teacherId;
    // Initialize with existing subjects (Set automatically handles duplicates)
    selectedSubjects = Set<String>.from(widget.assignment.subjects);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(
        'Edit Assignment',
        style: TextStyle(color: Colors.deepPurple[900]),
      ),
      content: isLoading
          ? const SizedBox(
              height: 200,
              child: Center(child: CircularProgressIndicator()),
            )
          : SingleChildScrollView(
              child: SizedBox(
                width: double.maxFinite,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildReadOnlyField('Class', widget.assignment.className),
                    const SizedBox(height: 12),
                    _buildReadOnlyField('Section', widget.assignment.section),
                    const SizedBox(height: 12),

                    TextFormField(
                      initialValue: widget.availableTeachers
                          .firstWhere(
                              (teacher) => teacher.id == selectedTeacherId,
                              orElse: () => Teacher(id: '', name: 'Unknown'))
                          .name,
                      enabled: false,
                      decoration: InputDecoration(
                        labelText: 'Assigned Teacher',
                        labelStyle: TextStyle(color: Colors.deepPurple[900]),
                        disabledBorder: const OutlineInputBorder(
                          borderSide: BorderSide(color: Colors.grey),
                        ),
                        filled: true,
                        fillColor: Colors.grey[100],
                      ),
                      style: TextStyle(color: Colors.grey[700]),
                    ),

                    const SizedBox(height: 16),

                    // Subjects Section
                    Text(
                      'Subjects',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.deepPurple[900],
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Current selected subjects display
                    if (selectedSubjects.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.blue[50],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.blue[200]!),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Currently Selected:',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.blue[800],
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              selectedSubjects.join(', '),
                              style: TextStyle(color: Colors.blue[700]),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 12),

                    // Subjects Checkbox List
                    Container(
                      height: 200,
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: widget.availableSubjects.isEmpty
                          ? const Center(
                              child: Text(
                                'No subjects available for this class',
                                style: TextStyle(color: Colors.grey),
                              ),
                            )
                          : ListView.builder(
                              shrinkWrap: true,
                              itemCount: widget.availableSubjects.length,
                              itemBuilder: (context, index) {
                                final subject = widget.availableSubjects[index];
                                final isSelected =
                                    selectedSubjects.contains(subject.name);

                                return CheckboxListTile(
                                  title: Text(subject.name),
                                  subtitle: subject.maxMarks != '0'
                                      ? Text('Max Marks: ${subject.maxMarks}')
                                      : null,
                                  value: isSelected,
                                  onChanged: (bool? value) {
                                    setState(() {
                                      if (value == true) {
                                        selectedSubjects.add(subject.name);
                                      } else {
                                        selectedSubjects.remove(subject.name);
                                      }
                                    });
                                  },
                                  controlAffinity:
                                      ListTileControlAffinity.leading,
                                  activeColor: Colors.deepPurple,
                                );
                              },
                            ),
                    ),
                  ],
                ),
              ),
            ),
      actions: [
        TextButton(
          onPressed: isLoading ? null : () => Navigator.pop(context),
          child: Text(
            'Cancel',
            style: TextStyle(color: Colors.deepPurple[900]),
          ),
        ),
        ElevatedButton(
          onPressed: (isLoading ||
                  selectedSubjects.isEmpty ||
                  selectedTeacherId == null)
              ? null
              : () async {
                  await _updateAssignment();
                },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.deepPurple,
            foregroundColor: Colors.white,
          ),
          child: isLoading
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : const Text('Save Changes'),
        ),
      ],
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    );
  }

  Widget _buildReadOnlyField(String label, String value) {
    return TextFormField(
      initialValue: value,
      enabled: false,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.deepPurple[900]),
        disabledBorder: const OutlineInputBorder(
          borderSide: BorderSide(color: Colors.grey),
        ),
        filled: true,
        fillColor: Colors.grey[100],
      ),
      style: TextStyle(color: Colors.grey[700]),
    );
  }

  Future<void> _updateAssignment() async {
    setState(() => isLoading = true);

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final response = await http.put(
        Uri.parse('$baseUrl/api/teacher-assignment/${widget.assignment.id}'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'teacher_id': selectedTeacherId,
          'subjects': selectedSubjects.toList(),
        }),
      );

      if (!mounted) return;

      if (response.statusCode == 200) {
        showCustomSnackBar(
          context,
          'Assignment updated successfully!',
          backgroundColor: Colors.green,
        );
        Navigator.pop(context);
        widget.onUpdate(widget.assignment);
      } else {
        // ✅ Try to read meaningful error message from backend response
        String errorMessage =
            'Failed to update assignment (${response.statusCode})';

        try {
          final data = json.decode(response.body);
          if (data != null && data['message'] != null) {
            errorMessage = data['message'];
          }
        } catch (_) {
          // Ignore parsing errors and use default errorMessage
        }

        showCustomSnackBar(
          context,
          errorMessage,
          backgroundColor: Colors.red,
        );
      }
    } catch (e) {
      showCustomSnackBar(
        context,
        'Error updating assignment: $e',
        backgroundColor: Colors.red,
      );
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }
}

// Model classes
class TeacherAssignment {
  final String id;
  final String teacherId;
  final String teacherName;
  final String classId;
  final String className;
  final String section;
  final Set<String> subjects; // Changed from List to Set

  TeacherAssignment({
    required this.id,
    required this.teacherId,
    required this.teacherName,
    required this.classId,
    required this.className,
    required this.section,
    required this.subjects,
  });
}

class Teacher {
  final String id;
  final String name;

  Teacher({required this.id, required this.name});
}

class Subject {
  final String id;
  final String name;
  final String maxMarks;

  Subject({required this.id, required this.name, required this.maxMarks});
}
