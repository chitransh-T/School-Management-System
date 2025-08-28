import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/pages/services/subject_service.dart';
import 'package:sms/pages/subjects/edit_subjects.dart';
import 'package:sms/widgets/custom_appbar.dart';

class ClassWithSubjectsPage extends StatefulWidget {
  const ClassWithSubjectsPage({super.key});

  @override
  State<ClassWithSubjectsPage> createState() => _ClassWithSubjectsPageState();
}

class _ClassWithSubjectsPageState extends State<ClassWithSubjectsPage> {
  List<ClassWithSubjects> classesWithSubjects = [];
  bool isLoading = true;
  String? token;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    _loadToken();
  }

  Future<void> _loadToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      token = prefs.getString('token');
      if (token != null) {
        await _loadClassesWithSubjects();
      } else {
        setState(() {
          errorMessage = 'No authentication token found';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error loading token: ${e.toString()}';
        isLoading = false;
      });
    }
  }

  Future<void> _loadClassesWithSubjects() async {
    try {
      setState(() {
        isLoading = true;
        errorMessage = null;
      });

      final fetchedData = await SubjectService.fetchClassesWithSubjects();

      setState(() {
        classesWithSubjects = fetchedData
            .map((data) => ClassWithSubjects.fromJson(data))
            .toList();

        if (classesWithSubjects.isEmpty) {
          errorMessage = 'No classes with subjects found';
        }
      });
    } catch (error) {
      setState(() {
        errorMessage = 'Error fetching data: ${error.toString()}';
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> _refreshData() async {
    await _loadClassesWithSubjects();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: 'Classes with Subjects',
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (isLoading) {
      return Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Colors.deepPurple[800]!),
        ),
      );
    }

    if (errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, color: Colors.red, size: 48),
            SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32.0),
              child: Text(
                errorMessage!,
                style: TextStyle(fontSize: 16, color: Colors.grey[800]),
                textAlign: TextAlign.center,
              ),
            ),
            SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadClassesWithSubjects,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.deepPurple[800],
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Text('Retry', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    }

    if (classesWithSubjects.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.class_, color: Colors.deepPurple[800], size: 48),
            SizedBox(height: 16),
            Text(
              'No classes with subjects found',
              style: TextStyle(fontSize: 16, color: Colors.grey[800]),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: Colors.deepPurple[800],
      onRefresh: _refreshData,
      child: ListView.separated(
        padding: EdgeInsets.all(16),
        itemCount: classesWithSubjects.length,
        separatorBuilder: (context, index) => SizedBox(height: 16),
        itemBuilder: (context, index) {
          final classData = classesWithSubjects[index];
          return _buildClassCard(classData);
        },
      ),
    );
  }

  Widget _buildClassCard(ClassWithSubjects classData) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ExpansionTile(
        tilePadding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              classData.className,
              style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: Colors.deepPurple[900]),
            ),
          ],
        ),
        subtitle: Text(
          '${classData.subjects.length} Subjects',
          style: TextStyle(fontSize: 14, color: Colors.grey[600]),
        ),
        leading: CircleAvatar(
          backgroundColor: Colors.deepPurple[100],
          child: Icon(Icons.class_, color: Colors.deepPurple[800]),
        ),
        trailing: IconButton(
          icon: Icon(Icons.edit, color: Colors.deepPurple),
          tooltip: 'Edit Subjects',
          onPressed: () {
            _navigateToEditPage(classData);
          },
        ),
        children: [
          if (classData.subjects.isEmpty)
            Padding(
              padding: EdgeInsets.all(16.0),
              child: Text('No subjects assigned yet',
                  style: TextStyle(color: Colors.grey[600])),
            )
          else
            ...classData.subjects.map((subject) => _buildSubjectTile(subject)),
        ],
      ),
    );
  }

  Widget _buildSubjectTile(Subject subject) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        border: Border(
          left: BorderSide(color: Colors.deepPurple[300]!, width: 3),
        ),
      ),
      child: ListTile(
        title: Text(
          subject.subjectName,
          style:
              TextStyle(fontWeight: FontWeight.w500, color: Colors.grey[800]),
        ),
        trailing: Container(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.deepPurple[50],
            borderRadius: BorderRadius.circular(16),
          ),
          child: Text(
            '${subject.marks} marks',
            style: TextStyle(
              color: Colors.deepPurple[800],
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: 16),
        dense: true,
      ),
    );
  }

  void _navigateToEditPage(ClassWithSubjects classData) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EditSubjectsPage(
          classData: classData,
          token: token!,
        ),
      ),
    ).then((result) {
      if (result == true) {
        _refreshData();
      }
    });
  }
}

class ClassWithSubjects {
  final String id;
  final String className;
  final String section;
  final List<Subject> subjects;

  ClassWithSubjects({
    required this.id,
    required this.className,
    required this.section,
    required this.subjects,
  });

  factory ClassWithSubjects.fromJson(Map<String, dynamic> json) {
    final subjectsData = json['subjects'] as List? ?? [];

    return ClassWithSubjects(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      className: (json['class_name'] ?? json['className'] ?? 'Unknown Class')
          .toString(),
      section: (json['section'] ?? 'Unknown Section').toString(),
      subjects: subjectsData
          .map((subjectJson) => Subject.fromJson(subjectJson))
          .toList(),
    );
  }
}

class Subject {
  final String id;
  final String subjectName;
  final String marks;

  Subject({
    required this.id,
    required this.subjectName,
    required this.marks,
  });

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(
      id: json['id'].toString(),
      subjectName: json['subject_name'].toString(),
      marks: json['marks'].toString(),
    );
  }
}
