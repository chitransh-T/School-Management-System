import 'package:flutter/material.dart';
import 'package:sms/pages/services/class_service.dart';
import '../student_registration_controller.dart';

class ClassSectionInfo extends StatefulWidget {
  final StudentRegistrationController controller;

  const ClassSectionInfo({super.key, required this.controller});

  @override
  State<ClassSectionInfo> createState() => _ClassSectionInfoState();
}

class _ClassSectionInfoState extends State<ClassSectionInfo> {
  List<Class> classes = [];
  List<String> availableSections = [];
  bool isLoading = true;
  Class? selectedClass;

  @override
  void initState() {
    super.initState();
    _loadClasses();
  }

  Future<void> _loadClasses() async {
    try {
      setState(() => isLoading = true);
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

      setState(() {
        classes = tempClasses;
      });
    } catch (error) {
      _showErrorSnackBar('Error fetching classes: ${error.toString()}');
    } finally {
      setState(() => isLoading = false);
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(color: Colors.deepPurple.shade100, width: 1),
      ),
      child: ExpansionTile(
        initiallyExpanded: true,
        collapsedBackgroundColor: Colors.deepPurple.shade50,
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        title: const Text(
          "CLASS & SECTION",
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.deepPurple,
            fontSize: 16,
          ),
        ),
        childrenPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: [
          const SizedBox(height: 8),
          isLoading
              ? Center(
                  child: CircularProgressIndicator(
                    color: Colors.deepPurple.shade700,
                  ),
                )
              : _buildClassDropdown(),
          const SizedBox(height: 16),
          _buildSectionDropdown(),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildClassDropdown() {
    return DropdownButtonFormField<Class>(
      value: selectedClass,
      decoration: InputDecoration(
        labelText: 'Assigned Class*',
        labelStyle: TextStyle(color: Colors.deepPurple.shade700),
        prefixIcon:
            Icon(Icons.class_outlined, color: Colors.deepPurple.shade600),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        enabledBorder: OutlineInputBorder(
          borderSide: BorderSide(color: Colors.deepPurple.shade300),
          borderRadius: BorderRadius.circular(8),
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: Colors.deepPurple.shade700, width: 2),
          borderRadius: BorderRadius.circular(8),
        ),
      ),
      items: classes.map((classItem) {
        return DropdownMenuItem<Class>(
          value: classItem,
          child: Text(
            classItem.className,
            style: TextStyle(color: Colors.deepPurple.shade800),
          ),
        );
      }).toList(),
      onChanged: (Class? newValue) {
        setState(() {
          selectedClass = newValue;
          widget.controller.selectedClass = newValue?.className;
          widget.controller.selectedSection = null;
          availableSections = newValue?.sections ?? [];
        });
      },
      validator: (value) => value == null ? 'Please select a class' : null,
      style: TextStyle(color: Colors.deepPurple.shade800),
    );
  }

  Widget _buildSectionDropdown() {
    return DropdownButtonFormField<String>(
      value: widget.controller.selectedSection,
      decoration: InputDecoration(
        labelText: 'Assigned Section*',
        labelStyle: TextStyle(color: Colors.deepPurple.shade700),
        prefixIcon:
            Icon(Icons.groups_outlined, color: Colors.deepPurple.shade600),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        enabledBorder: OutlineInputBorder(
          borderSide: BorderSide(color: Colors.deepPurple.shade300),
          borderRadius: BorderRadius.circular(8),
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: Colors.deepPurple.shade700, width: 2),
          borderRadius: BorderRadius.circular(8),
        ),
      ),
      items: availableSections.map((section) {
        return DropdownMenuItem<String>(
          value: section,
          child: Text(
            section,
            style: TextStyle(color: Colors.deepPurple.shade800),
          ),
        );
      }).toList(),
      onChanged: (value) {
        setState(() {
          widget.controller.selectedSection = value;
        });
      },
      validator: (value) => value == null ? 'Please select a section' : null,
      style: TextStyle(color: Colors.deepPurple.shade800),
    );
  }
}

class Class {
  final String id;
  final String className;
  final List<String> sections;

  Class({
    required this.id,
    required this.className,
    required this.sections,
  });

  factory Class.fromJson(Map<String, dynamic> json) {
    return Class(
      id: (json['_id'] ?? json['id'] ?? '').toString().trim(),
      className: (json['class_name'] ?? json['className'] ?? 'Unknown Class')
          .toString()
          .trim(),
      sections: [],
    );
  }
}
