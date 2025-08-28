import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:sms/pages/classes/edit_class.dart';
import 'package:sms/pages/services/class_service.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart'; // <-- Import custom snackbar here

class AllClassesPage extends StatefulWidget {
  const AllClassesPage({super.key});

  @override
  State<AllClassesPage> createState() => _AllClassesPageState();
}

class _AllClassesPageState extends State<AllClassesPage> {
  List<Class> classes = [];
  List<Teacher> teachers = [];
  bool isLoading = true;
  bool isFetchingTeachers = false;
  String? token;
  static final String baseeUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';
  final List<String> classOptions = [
    'Nursery',
    'LKG',
    'UKG',
    'class 1',
    'class 2',
    'class 3',
    'class 4',
    'class 5',
    'class 6',
    'class 7',
    'class 8',
    'class 9',
    'class 10',
    'class 11',
    'class 12',
  ];

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
      await _loadClasses();
      await _fetchTeachers();
    }
  }

  Future<void> _loadClasses() async {
    try {
      setState(() => isLoading = true);

      final fetchedClasses = await ClassService.fetchClasses();
      final studentCounts = await ClassService.modelgetStudentCountByClass();

      final Map<String, int> countMap = {};
      for (final item in studentCounts) {
        try {
          final className =
              (item['class_name'] ?? '').toString().toLowerCase().trim();
          final section =
              (item['section'] ?? '').toString().toLowerCase().trim();
          final key = '$className|$section';
          final count = _parseCount(item['student_count'] ?? 0);

          if (className.isNotEmpty && section.isNotEmpty) {
            countMap[key] = count;
          }
        } catch (e) {
          debugPrint('Error processing count item: $e');
        }
      }

      final classesWithCounts = fetchedClasses
          .map((classData) {
            final className =
                classData['class_name']?.toString() ?? 'Unassigned';
            final section = classData['section']?.toString() ?? '';
            final key =
                '${className.toLowerCase().trim()}|${section.toLowerCase().trim()}';
            final studentCount = countMap[key] ?? 0;

            final teacherId =
                classData['teacher_id']?.toString() ?? 'No Teacher Assigned';

            return Class.fromJson({
              ...classData,
              'student_count': studentCount,
              'teacher_id': teacherId,
              'section': classData['section'] ?? '',
            });
          })
          .where((c) => c.id.isNotEmpty)
          .toList();

      // setState(() => classes = classesWithCounts);
      final List<String> sectionOptions = [
        'Section A',
        'Section B',
        'Section C',
        'Section D',
      ];

      classesWithCounts.sort((a, b) {
        int classIndexA = classOptions.indexWhere(
            (opt) => opt.toLowerCase() == a.className.toLowerCase().trim());
        int classIndexB = classOptions.indexWhere(
            (opt) => opt.toLowerCase() == b.className.toLowerCase().trim());

        if (classIndexA == classIndexB) {
          int sectionIndexA = sectionOptions.indexWhere(
              (opt) => opt.toLowerCase() == a.section.toLowerCase().trim());
          int sectionIndexB = sectionOptions.indexWhere(
              (opt) => opt.toLowerCase() == b.section.toLowerCase().trim());

          return sectionIndexA.compareTo(sectionIndexB);
        }

        return classIndexA.compareTo(classIndexB);
      });

      setState(() => classes = classesWithCounts);
    } catch (error) {
      debugPrint('Error in _loadClasses: $error');
      _showErrorSnackBar('Failed to load classes. Please try again.');
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  int _parseCount(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  Future<void> _fetchTeachers() async {
    if (token == null) return;

    setState(() {
      isFetchingTeachers = true;
    });

    try {
      final response = await http.get(
        Uri.parse('$baseeUrl/api/teachers'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token!,
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> teacherData = json.decode(response.body);
        setState(() {
          teachers = teacherData
              .map((data) => Teacher(
                    id: data['_id']?.toString() ?? data['id']?.toString() ?? '',
                    name: data['teacher_name']?.toString() ?? 'Unknown Teacher',
                  ))
              .where((teacher) => teacher.id.isNotEmpty)
              .toList();
        });
      } else {
        _showErrorSnackBar('Failed to load teachers: ${response.reasonPhrase}');
      }
    } catch (error) {
      _showErrorSnackBar(
          'Error connecting to server. Please check your connection.');
    } finally {
      setState(() {
        isFetchingTeachers = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: 'All Classes',
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (isLoading) {
      return Center(
        child: CircularProgressIndicator(color: Colors.deepPurple[900]),
      );
    }

    if (classes.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.class_,
                // size: 48, color: Colors.deepPurple[900]!.withOpacity(0.5)
                color: Colors.deepPurple[900]!.withAlpha((0.5 * 255).round())),
            SizedBox(height: 16),
            Text(
              'No Classes Available',
              style: TextStyle(
                fontSize: 18,
                color: Colors.deepPurple[900],
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Tap the + button to add a new class',
              style: TextStyle(
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadClasses,
      color: Colors.deepPurple[900],
      child: ListView.separated(
        padding: EdgeInsets.all(16),
        itemCount: classes.length,
        separatorBuilder: (context, index) => SizedBox(height: 12),
        itemBuilder: (context, index) {
          final classItem = classes[index];
          return _buildClassCard(classItem);
        },
      ),
    );
  }

  Widget _buildClassCard(Class classItem) {
    final teacherName = teachers
        .firstWhere(
          (teacher) => teacher.id == classItem.teacherId,
          orElse: () => Teacher(id: '', name: 'No Teacher Assigned'),
        )
        .name;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _openEditDialog(classItem),
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${classItem.className} (${classItem.section})',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.deepPurple[900],
                    ),
                  ),
                  _buildStudentCountBadge(classItem.studentCount),
                ],
              ),
              SizedBox(height: 12),
              _buildInfoRow(Icons.person, teacherName),
              SizedBox(height: 12),
              _buildActionButtons(classItem),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStudentCountBadge(int count) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.deepPurple[50],
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.people, size: 16, color: Colors.deepPurple[900]),
          SizedBox(width: 4),
          Text(
            count.toString(),
            style: TextStyle(
              color: Colors.deepPurple[900],
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon,
            size: 18,
            color: Colors.deepPurple[900]!.withAlpha((0.7 * 255).round())),
        SizedBox(width: 8),
        Flexible(
          child: Text(
            text,
            style: TextStyle(
              color: Colors.grey[800],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(Class classItem) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        _buildIconButton(
          icon: Icons.edit,
          color: Colors.deepPurple[600]!,
          onPressed: () => _openEditDialog(classItem),
        ),
        SizedBox(width: 8),
        _buildIconButton(
          icon: Icons.delete,
          color: Colors.red[400]!,
          onPressed: () => _deleteClass(classItem),
        ),
      ],
    );
  }

  Widget _buildIconButton({
    required IconData icon,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return Container(
      decoration: BoxDecoration(
        // color: color.withOpacity(0.1),
        color: color.withAlpha((0.1 * 255).round()),
        shape: BoxShape.circle,
      ),
      child: IconButton(
        icon: Icon(icon, size: 20, color: color),
        onPressed: onPressed,
        splashRadius: 20,
        padding: EdgeInsets.zero,
        constraints: BoxConstraints(),
      ),
    );
  }

  Future<void> _deleteClass(Class classItem) async {
    if (classItem.id.isEmpty) {
      if (!mounted) return;
      _showErrorSnackBar('Cannot delete class - invalid ID');
      return;
    }

    final confirmDelete = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Confirm Deletion'),
          content:
              Text('Are you sure you want to delete "${classItem.className}"?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmDelete == true) {
      try {
        final success = await ClassService.deleteClass(classItem.id);

        if (!mounted) return;

        if (success) {
          setState(() {
            classes.removeWhere((c) => c.id == classItem.id);
          });
          showCustomSnackBar(
            context,
            'Class deleted successfully',
            backgroundColor: Colors.red[400]!,
          );
        } else {
          showCustomSnackBar(
            context,
            'Failed to delete class',
            backgroundColor: Colors.red[400]!,
          );
        }
      } catch (error) {
        if (!mounted) return;
        showCustomSnackBar(
          context,
          'Error deleting class: $error',
          backgroundColor: Colors.red[400]!,
        );
      }
    }
  }

  void _openEditDialog(Class classItem) async {
    final updated = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EditClassPage(
          classItem: classItem,
          teachers: teachers,
        ),
      ),
    );

    if (updated == true) {
      await _loadClasses();
      if (!mounted) return;
      showCustomSnackBar(
        context,
        'Class updated successfully',
        backgroundColor: Colors.green[400]!,
      );
    }
  }

  void _showErrorSnackBar(String message) {
    showCustomSnackBar(
      context,
      message,
      backgroundColor: Colors.red[400]!,
    );
  }
}

class Class {
  final String id;
  final String className;
  final String teacherId;
  final int studentCount;
  final String section;

  Class({
    required this.id,
    required this.className,
    required this.teacherId,
    required this.studentCount,
    required this.section,
  });

  factory Class.fromJson(Map<String, dynamic> json) {
    return Class(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      className: json['class_name']?.toString() ?? 'Unknown Class',
      teacherId: json['teacher_id']?.toString() ?? 'No Teacher Assigned',
      studentCount: json['student_count'] ?? 0,
      section: json['section']?.toString() ?? '',
    );
  }
}

class Teacher {
  final String id;
  final String name;

  Teacher({
    required this.id,
    required this.name,
  });
}
