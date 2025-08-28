import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/pages/services/student_service.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';
import 'package:sms/widgets/search_bar.dart';
import 'package:sms/widgets/user_photo_widget.dart';
import 'package:sms/widgets/pdf_viewer_widget.dart';
import 'package:sms/models/student_model.dart';
import 'edit_student.dart';
import 'delete_student.dart';
import 'package:sms/pages/services/class_service.dart';
import 'package:sms/models/class_model.dart';

final String baseeUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';
final String uploadBaseUrl = '$baseeUrl/uploads';

class StudentProfileManagementPage extends StatefulWidget {
  const StudentProfileManagementPage({super.key});

  @override
  State<StudentProfileManagementPage> createState() =>
      _StudentProfileManagementPageState();
}

class _StudentProfileManagementPageState
    extends State<StudentProfileManagementPage> {
  List<Student> students = [];
  List<Student> filteredStudents = [];
  TextEditingController searchController = TextEditingController();
  String? selectedClass;
  String? selectedSection;
  List<Class> classes = [];
  List<String> availableSections = [];
  bool _isLoading = true;
  String? token;

  @override
  void initState() {
    super.initState();
    _loadToken();
  }

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      token = prefs.getString('token');
    });
    if (token != null) {
      await _loadClasses();
      await _fetchInitialData();
    }
  }

  Future<void> _loadClasses() async {
    try {
      if (!mounted) return;
      setState(() => _isLoading = true);
      final fetchedClasses = await ClassService.fetchClasses();

      final Map<String, Set<String>> classSectionMap = {};
      final List<Class> tempClasses = [];

      for (final data in fetchedClasses) {
        final className =
            (data['class_name'] ?? data['className'] ?? '').toString().trim();
        final section = (data['section'] ?? '').toString().trim();

        if (className.isEmpty) continue;

        if (!classSectionMap.containsKey(className)) {
          classSectionMap[className] = {};
        }

        classSectionMap[className]!.add(section);
      }

      classSectionMap.forEach((className, sections) {
        tempClasses.add(Class(
          id: className,
          className: className,
          sections: sections.toList(),
        ));
      });
      if (!mounted) return;
      setState(() {
        classes = tempClasses;
      });
    } catch (error) {
      showCustomSnackBar(context, 'Error fetching classes: ${error.toString()}',
          backgroundColor: Colors.red);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _updateAvailableSections(String? className) {
    setState(() {
      if (className != null) {
        final selectedClassObj =
            classes.firstWhere((c) => c.className == className);
        availableSections = selectedClassObj.sections;
      } else {
        availableSections = [];
      }
      selectedSection = null;
    });
    _filterStudents();
  }

  Future<void> _fetchInitialData() async {
    await _fetchStudents();
  }

  Future<void> _fetchStudents() async {
    try {
      final studentService = StudentService();
      final fetchedStudents = await studentService.fetchStudents();
      if (!mounted) return;
      setState(() {
        students = fetchedStudents;
        filteredStudents = fetchedStudents;
      });
    } catch (e) {
      showCustomSnackBar(context, 'Error loading students: $e',
          backgroundColor: Colors.red);
    }
  }

  void _filterStudents() {
    setState(() {
      filteredStudents = students.where((student) {
        final nameMatch = student.name
            .toLowerCase()
            .contains(searchController.text.toLowerCase());
        final classMatch =
            selectedClass == null || student.assignedClass == selectedClass;
        final sectionMatch = selectedSection == null ||
            student.assignedSection == selectedSection;
        return nameMatch && classMatch && sectionMatch;
      }).toList();
    });
  }

  Future<void> _editStudent(Student student) async {
    await showDialog(
      context: context,
      builder: (context) => EditStudentDialog(
        student: student,
        classes: classes,
        onStudentUpdated: _fetchInitialData,
      ),
    );
  }

  Future<void> _deleteStudent(int index) async {
    final student = filteredStudents[index];
    final confirmed = await showDeleteStudentDialog(context, student.name);

    if (confirmed) {
      try {
        final studentService = StudentService();
        await studentService.deleteStudent(student.id);
        if (!mounted) return;
        setState(() {
          students.removeWhere((s) => s.id == student.id);
          filteredStudents.removeWhere((s) => s.id == student.id);
        });

        showCustomSnackBar(context, 'Student deleted successfully',
            backgroundColor: Colors.red);
      } catch (e) {
        if (!mounted) return;
        showCustomSnackBar(context, 'Failed to delete student: ${e.toString()}',
            backgroundColor: Colors.red);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final deepPurpleTheme = Colors.deepPurple.shade800;
    final screenHeight = MediaQuery.of(context).size.height;
    final isLandscape =
        MediaQuery.of(context).orientation == Orientation.landscape;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(
        title: 'Student Profile Management',
      ),
      body: _isLoading
          ? Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(deepPurpleTheme),
              ),
            )
          : SingleChildScrollView(
              child: Column(
                children: [
                  _buildFilterSection(isLandscape, deepPurpleTheme),
                  SizedBox(
                    height:
                        isLandscape ? screenHeight * 0.5 : screenHeight * 0.6,
                    child: Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: isLandscape ? 8.0 : 16.0,
                      ),
                      child: filteredStudents.isEmpty
                          ? _buildEmptyState(isLandscape, deepPurpleTheme)
                          : _buildStudentList(isLandscape, deepPurpleTheme),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildFilterSection(bool isLandscape, Color deepPurpleTheme) {
    return Padding(
      padding: EdgeInsets.all(isLandscape ? 8.0 : 16.0),
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: Padding(
          padding: EdgeInsets.all(isLandscape ? 8.0 : 16.0),
          child: Column(
            children: [
              CustomSearchBar(
                hintText: 'Search Students',
                controller: searchController,
                onClear: () {
                  searchController.clear();
                  _filterStudents();
                },
                onChanged: (value) => _filterStudents(),
              ),
              SizedBox(height: isLandscape ? 8 : 16),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: selectedClass,
                      decoration: InputDecoration(
                        labelText: 'Filter by Class',
                        labelStyle: TextStyle(
                          color: deepPurpleTheme,
                          fontSize: isLandscape ? 12 : 14,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              BorderSide(color: Colors.deepPurple.shade300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              BorderSide(color: deepPurpleTheme, width: 2),
                        ),
                        filled: true,
                        fillColor: Colors.deepPurple.shade50,
                      ),
                      items: [
                        DropdownMenuItem(
                          value: null,
                          child: Text(
                            'All Classes',
                            style: TextStyle(
                              color: Colors.deepPurple.shade900,
                              fontSize: isLandscape ? 12 : 14,
                            ),
                          ),
                        ),
                        ...classes.map((classItem) {
                          return DropdownMenuItem<String>(
                            value: classItem.className,
                            child: Text(
                              classItem.className,
                              style: TextStyle(
                                color: Colors.deepPurple.shade900,
                                fontSize: isLandscape ? 12 : 14,
                              ),
                            ),
                          );
                        }),
                      ],
                      onChanged: (String? newValue) {
                        setState(() {
                          selectedClass = newValue;
                          _updateAvailableSections(newValue);
                        });
                      },
                    ),
                  ),
                  SizedBox(width: isLandscape ? 8 : 16),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: selectedSection,
                      decoration: InputDecoration(
                        labelText: 'Filter by Section',
                        labelStyle: TextStyle(
                          color: deepPurpleTheme,
                          fontSize: isLandscape ? 12 : 14,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              BorderSide(color: Colors.deepPurple.shade300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              BorderSide(color: deepPurpleTheme, width: 2),
                        ),
                        filled: true,
                        fillColor: Colors.deepPurple.shade50,
                      ),
                      items: [
                        DropdownMenuItem(
                          value: null,
                          child: Text(
                            'All Sections',
                            style: TextStyle(
                              color: Colors.deepPurple.shade900,
                              fontSize: isLandscape ? 12 : 14,
                            ),
                          ),
                        ),
                        ...availableSections.map((value) {
                          return DropdownMenuItem<String>(
                            value: value,
                            child: Text(
                              value,
                              style: TextStyle(
                                color: Colors.deepPurple.shade900,
                                fontSize: isLandscape ? 12 : 14,
                              ),
                            ),
                          );
                        }),
                      ],
                      onChanged: (String? newValue) {
                        setState(() {
                          selectedSection = newValue;
                          _filterStudents();
                        });
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isLandscape, Color deepPurpleTheme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.people_outline,
            size: isLandscape ? 40 : 60,
            color: Colors.grey.shade400,
          ),
          SizedBox(height: isLandscape ? 8 : 16),
          Text(
            selectedClass == null &&
                    selectedSection == null &&
                    searchController.text.isEmpty
                ? 'No students found'
                : 'No students match your filters',
            style: TextStyle(
              fontSize: isLandscape ? 16 : 18,
              color: Colors.grey.shade600,
            ),
          ),
          if (selectedClass != null ||
              selectedSection != null ||
              searchController.text.isNotEmpty)
            TextButton(
              onPressed: () {
                setState(() {
                  selectedClass = null;
                  selectedSection = null;
                  searchController.clear();
                  filteredStudents = students;
                });
              },
              child: Text(
                'Clear Filters',
                style: TextStyle(
                  color: deepPurpleTheme,
                  fontSize: isLandscape ? 12 : 14,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStudentList(bool isLandscape, Color deepPurpleTheme) {
    return ListView.builder(
      itemCount: filteredStudents.length,
      itemBuilder: (context, index) {
        final student = filteredStudents[index];
        return Card(
          elevation: 2,
          margin: EdgeInsets.only(bottom: isLandscape ? 8 : 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: ListTile(
            contentPadding: EdgeInsets.all(isLandscape ? 8 : 12),
            leading: Container(
              width: isLandscape ? 40 : 50,
              height: isLandscape ? 40 : 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.deepPurple.shade100,
                  width: 2,
                ),
              ),
              child: ClipOval(
                child: buildUserPhoto(student.studentPhoto, uploadBaseUrl),
              ),
            ),
            title: Text(
              student.name,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: deepPurpleTheme,
                fontSize: isLandscape ? 14 : 16,
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Registration: ${student.registrationNumber}',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: isLandscape ? 12 : 14,
                  ),
                ),
                Text(
                  '${student.assignedClass} - ${student.assignedSection}',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: isLandscape ? 12 : 14,
                  ),
                ),
              ],
            ),
            trailing: PopupMenuButton(
              icon: Icon(
                Icons.more_vert,
                color: deepPurpleTheme,
                size: isLandscape ? 20 : 24,
              ),
              itemBuilder: (context) => [
                PopupMenuItem(
                  value: 'edit',
                  child: Row(
                    children: [
                      Icon(
                        Icons.edit,
                        color: deepPurpleTheme,
                        size: isLandscape ? 18 : 20,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Edit',
                        style: TextStyle(
                          color: Colors.deepPurple.shade900,
                          fontSize: isLandscape ? 12 : 14,
                        ),
                      ),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(
                        Icons.delete,
                        color: Colors.red.shade400,
                        size: isLandscape ? 18 : 20,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Delete',
                        style: TextStyle(
                          color: Colors.red.shade600,
                          fontSize: isLandscape ? 12 : 14,
                        ),
                      ),
                    ],
                  ),
                ),
                if (student.birthCertificate.isNotEmpty)
                  PopupMenuItem(
                    value: 'view_certificate',
                    child: Row(
                      children: [
                        Icon(
                          Icons.picture_as_pdf,
                          color: Colors.green.shade600,
                          size: isLandscape ? 18 : 20,
                        ),
                        SizedBox(width: 8),
                        Text(
                          'View Certificate',
                          style: TextStyle(
                            color: Colors.green.shade800,
                            fontSize: isLandscape ? 12 : 14,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
              onSelected: (value) async {
                if (value == 'edit') {
                  await _editStudent(student);
                } else if (value == 'delete') {
                  await _deleteStudent(index);
                } else if (value == 'view_certificate') {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => PDFViewerScreen(
                        pdfData: student.birthCertificate,
                        baseUrl: uploadBaseUrl,
                        title: 'Birth Certificate',
                        label: 'Birth Certificate PDF',
                      ),
                    ),
                  );
                }
              },
            ),
          ),
        );
      },
    );
  }
}
