import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/pages/student/admission/admission_confirm.dart';
import 'package:sms/pages/services/student_service.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/class_section_selector.dart';
import 'package:sms/widgets/custom_snackbar.dart';
import 'package:sms/models/student_model.dart';

class AdmissionLetterPage extends StatefulWidget {
  const AdmissionLetterPage({super.key});

  @override
  State<AdmissionLetterPage> createState() => _AdmissionLetterPageState();
}

class _AdmissionLetterPageState extends State<AdmissionLetterPage> {
  List<Student> students = [];
  List<Student> filteredStudents = [];
  bool isLoadingStudents = false;
  String? token;
  static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  ClassModel? selectedClass;
  String? selectedSection;

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
  }

  Future<void> _fetchStudentsByClass(ClassModel? cls) async {
    if (token == null || cls == null) {
      showCustomSnackBar(context, 'Please login or select a class',
          backgroundColor: Colors.red);
      return;
    }

    setState(() {
      isLoadingStudents = true;
      students = [];
      filteredStudents = [];
    });

    try {
      final studentService = StudentService();
      final fetchedStudents =
          await studentService.fetchStudentsByClass(cls.className, token!);
      setState(() {
        students = fetchedStudents;
        filteredStudents = List.from(students);
        _filterStudents();
      });
    } catch (error) {
      if (!mounted) return;
      showCustomSnackBar(context, 'Error loading students: $error',
          backgroundColor: Colors.red);
    } finally {
      setState(() => isLoadingStudents = false);
    }
  }

  void _filterStudents() {
    setState(() {
      filteredStudents = students.where((student) {
        final sectionMatch = selectedSection == null ||
            student.assignedSection == selectedSection;
        return sectionMatch;
      }).toList();
    });
  }

  void _viewAdmissionConfirmation(Student student) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AdmissionConfirmationPage(student: student),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Admission Letters',
      ),
      body: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                elevation: 3,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Filter Students',
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.deepPurple[800])),
                      const SizedBox(height: 12),
                      ClassSectionSelector(
                        onSelectionChanged: (ClassModel? cls, String? sec) {
                          setState(() {
                            selectedClass = cls;
                            selectedSection = sec;
                            if (cls != null) {
                              _fetchStudentsByClass(cls);
                            } else {
                              students = [];
                              filteredStudents = [];
                            }
                            _filterStudents();
                          });
                        },
                        initialClass: selectedClass,
                        initialSection: selectedSection,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              isLoadingStudents
                  ? Container(
                      constraints: BoxConstraints(
                          minHeight: MediaQuery.of(context).size.height * 0.4),
                      child: const Center(
                          child: CircularProgressIndicator(
                              color: Colors.deepPurple)),
                    )
                  : selectedClass == null
                      ? Container(
                          constraints: BoxConstraints(
                              minHeight:
                                  MediaQuery.of(context).size.height * 0.4),
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.school,
                                    size: 48, color: Colors.deepPurple[800]),
                                const SizedBox(height: 16),
                                Text('Please select a class to view students',
                                    style: TextStyle(
                                        fontSize: 16,
                                        color: Colors.deepPurple[900])),
                              ],
                            ),
                          ),
                        )
                      : filteredStudents.isEmpty
                          ? Container(
                              constraints: BoxConstraints(
                                  minHeight:
                                      MediaQuery.of(context).size.height * 0.4),
                              child: Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                        selectedSection == null
                                            ? Icons.people_outline
                                            : Icons.filter_alt_outlined,
                                        size: 48,
                                        color: Colors.deepPurple[800]),
                                    const SizedBox(height: 16),
                                    Text(
                                        selectedSection == null
                                            ? 'No students found in this class'
                                            : 'No students found in this section',
                                        style: TextStyle(
                                            fontSize: 16,
                                            color: Colors.deepPurple[900])),
                                  ],
                                ),
                              ),
                            )
                          : Container(
                              constraints: BoxConstraints(
                                  minHeight:
                                      MediaQuery.of(context).size.height * 0.4),
                              child: ListView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: filteredStudents.length,
                                itemBuilder: (context, index) {
                                  final student = filteredStudents[index];
                                  return Card(
                                    margin:
                                        const EdgeInsets.symmetric(vertical: 8),
                                    elevation: 2,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: ListTile(
                                      contentPadding:
                                          const EdgeInsets.symmetric(
                                              horizontal: 16, vertical: 12),
                                      leading: _buildStudentPhoto(
                                          student.studentPhoto),
                                      title: Text(student.name,
                                          style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              color: Colors.deepPurple[900])),
                                      subtitle: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                              'Reg: ${student.registrationNumber}',
                                              style: TextStyle(
                                                  color:
                                                      Colors.deepPurple[800])),
                                          Text(
                                              'Class: ${student.assignedClass} • Section: ${student.assignedSection}',
                                              style: TextStyle(
                                                  color:
                                                      Colors.deepPurple[800])),
                                        ],
                                      ),
                                      trailing: Container(
                                        padding: const EdgeInsets.all(6),
                                        decoration: BoxDecoration(
                                          color: Colors.deepPurple[50],
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(Icons.arrow_forward,
                                            color: Colors.deepPurple[800],
                                            size: 20),
                                      ),
                                      onTap: () =>
                                          _viewAdmissionConfirmation(student),
                                    ),
                                  );
                                },
                              ),
                            ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStudentPhoto(String photoPath) {
    if (photoPath.isEmpty) {
      return CircleAvatar(
        backgroundColor: Colors.deepPurple[100],
        child: Icon(Icons.person, color: Colors.deepPurple[800]),
      );
    }
    return CircleAvatar(
      backgroundImage: NetworkImage(
        photoPath.startsWith('http')
            ? photoPath
            : '$baseUrl/uploads/$photoPath',
      ),
      onBackgroundImageError: (exception, stackTrace) =>
          Icon(Icons.error, color: Colors.red[800]),
    );
  }
}
