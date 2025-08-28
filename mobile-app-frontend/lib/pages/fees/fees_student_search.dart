import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';
import 'package:sms/widgets/class_section_selector.dart';
import 'fees_collection_detail_page.dart';

class FeeCollectPage extends StatefulWidget {
  const FeeCollectPage({super.key});

  @override
  State<FeeCollectPage> createState() => _FeeCollectPageState();
}

class _FeeCollectPageState extends State<FeeCollectPage> {
  List<StudentModel> students = [];
  List<StudentModel> filteredStudents = [];
  bool isLoadingStudents = false;
  String? token;
  final TextEditingController searchController = TextEditingController();
  static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  // Caches for class IDs and fee structures
  static final Map<String, String> classIdCache = {};
  static final Map<String, List<FeeStructureModel>> feeStructureCache = {};

  ClassModel? selectedClass;
  String? selectedSection;

  @override
  void initState() {
    super.initState();
    _loadToken();
    searchController.addListener(_filterStudents);
  }

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      token = prefs.getString('token');
    });
  }

  Future<void> _fetchStudents() async {
    if (token == null || selectedClass == null) {
      showCustomSnackBar(context, 'Please login or select a class',
          backgroundColor: Colors.red);
      return;
    }

    setState(() {
      isLoadingStudents = true;
      filteredStudents = [];
    });

    final classNameEncoded = Uri.encodeComponent(selectedClass!.className);
    try {
      final resp = await http.get(
        Uri.parse('$baseUrl/api/students/$classNameEncoded'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token!,
        },
      );
      if (resp.statusCode == 200) {
        final data = json.decode(resp.body) as List<dynamic>;
        setState(() {
          students = data
              .map((d) {
                return StudentModel(
                  id: d['_id']?.toString() ?? d['id']?.toString() ?? '',
                  name: d['student_name']?.toString() ?? 'Unknown Student',
                  classId: selectedClass!.id.toString(),
                  className: selectedClass!.className,
                  section: d['assigned_section']?.toString() ?? '',
                );
              })
              .where((s) => s.id.isNotEmpty)
              .toList();
          _filterStudents();
        });
      } else {
        showCustomSnackBar(
            context, 'Failed to load students: ${resp.reasonPhrase}',
            backgroundColor: Colors.red);
      }
    } catch (e) {
      showCustomSnackBar(context, 'Error loading students: $e',
          backgroundColor: Colors.red);
    } finally {
      setState(() => isLoadingStudents = false);
    }
  }

  Future<Map<String, dynamic>> _fetchStudentFeeData(StudentModel st) async {
    final classId =
        classIdCache[st.className] ?? await _getClassId(st.className);
    final feeStrList =
        feeStructureCache[classId] ?? await _getFeeStructure(classId);
    final paidIds = await _getPaidFees(st.id);
    final prevBal = await _getPreviousBalance(st.id);

    double totalYearly = 0.0;
    for (var fee in feeStrList) {
      if (!paidIds.contains(fee.feeMasterId.toString()) || !fee.isOneTime) {
        totalYearly += double.tryParse(fee.amount) ?? 0.0;
      }
    }

    return {
      'classId': classId,
      'feeStructure': feeStrList,
      'paidFeeMasterIds': paidIds,
      'previousBalance': prevBal,
      'totalYearlyFee': totalYearly,
    };
  }

  Future<String> _getClassId(String name) async {
    if (classIdCache.containsKey(name)) return classIdCache[name]!;

    try {
      final resp = await http.get(
        Uri.parse('$baseUrl/api/classes'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token!,
        },
      );
      if (resp.statusCode == 200) {
        final list = json.decode(resp.body) as List<dynamic>;
        for (var d in list) {
          final nm =
              (d['class_name'] ?? d['className'] ?? '').toString().trim();
          if (nm.toLowerCase() == name.toLowerCase()) {
            final id = d['id']?.toString() ?? d['class_id']?.toString();
            if (id != null) {
              classIdCache[name] = id;
              return id;
            }
          }
        }
      }
    } catch (_) {}
    classIdCache[name] = name;
    return name;
  }

  Future<List<FeeStructureModel>> _getFeeStructure(String classId) async {
    if (feeStructureCache.containsKey(classId))
      return feeStructureCache[classId]!;

    try {
      final resp = await http.get(
        Uri.parse('$baseUrl/api/feestructure/$classId'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token!,
        },
      );
      if (resp.statusCode == 200) {
        final decoded = json.decode(resp.body);
        final list =
            decoded is List ? decoded : decoded['data'] as List<dynamic>;
        final mapped = list.map((i) => FeeStructureModel.fromJson(i)).toList();
        feeStructureCache[classId] = mapped;
        return mapped;
      }
    } catch (_) {}
    return [];
  }

  Future<List<String>> _getPaidFees(String sid) async {
    try {
      final resp = await http.get(
        Uri.parse('$baseUrl/api/fees/paid?studentId=$sid'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token!,
        },
      );
      if (resp.statusCode == 200) {
        return List<String>.from(json.decode(resp.body));
      }
    } catch (_) {}
    return [];
  }

  Future<double> _getPreviousBalance(String sid) async {
    try {
      final resp = await http.get(
        Uri.parse('$baseUrl/api/summary/$sid'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token!,
        },
      );
      if (resp.statusCode == 200) {
        return (json.decode(resp.body)['data']['last_due_balance'] ?? 0)
            .toDouble();
      }
    } catch (_) {}
    return 0.0;
  }

  void _filterStudents() {
    final search = searchController.text.toLowerCase();
    setState(() {
      filteredStudents = students.where((s) {
        final nm = s.name.toLowerCase().contains(search);
        final secMatch =
            selectedSection == null || s.section == selectedSection;
        return nm && secMatch;
      }).toList();
    });
  }

  Future<void> _openFeePage(StudentModel st) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    final data = await _fetchStudentFeeData(st);
    if (!mounted) return;
    Navigator.pop(context);

    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => FeesCollectionPage(
          studentId: st.id,
          studentName: st.name,
          studentClass: st.className,
          studentSection: st.section,
          isNewAdmission: false,
          preloadedData: data,
        ),
      ),
    );

    // 🔄 Clear caches after return
    classIdCache.clear();
    feeStructureCache.clear();
  }

  @override
  Widget build(BuildContext context) {
    final color = Colors.deepPurple.shade900;
    final height = MediaQuery.of(context).size.height;
    final isLandscape =
        MediaQuery.of(context).orientation == Orientation.landscape;

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: const CustomAppBar(title: 'Collect Fee'),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(isLandscape ? 8 : 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Class/Section selector
              Card(
                elevation: 4,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Filter Students',
                          style: TextStyle(
                              fontSize: isLandscape ? 16 : 18,
                              fontWeight: FontWeight.bold,
                              color: color)),
                      const SizedBox(height: 8),
                      ClassSectionSelector(
                        onSelectionChanged: (cls, sec) {
                          setState(() {
                            selectedClass = cls;
                            selectedSection = sec;
                            students = [];
                            filteredStudents = [];
                          });
                          if (cls != null) _fetchStudents();
                        },
                        initialClass: selectedClass,
                        initialSection: selectedSection,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              if (selectedClass != null)
                TextField(
                  controller: searchController,
                  decoration: InputDecoration(
                    labelText: 'Search Student',
                    prefixIcon: Icon(Icons.search, color: color),
                    filled: true,
                    fillColor: Colors.deepPurple.shade50,
                    border: InputBorder.none,
                  ),
                ),
              const SizedBox(height: 16),
              if (selectedClass != null)
                Text('Students',
                    style: TextStyle(
                        fontSize: isLandscape ? 16 : 18,
                        fontWeight: FontWeight.bold,
                        color: color)),
              const SizedBox(height: 8),
              SizedBox(
                height: isLandscape ? height * 0.5 : height * 0.6,
                child: isLoadingStudents
                    ? Center(child: CircularProgressIndicator(color: color))
                    : selectedClass == null
                        ? Center(
                            child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.school,
                                  color: color, size: isLandscape ? 36 : 48),
                              const SizedBox(height: 8),
                              Text(
                                'Select a class to view students',
                                style: TextStyle(
                                    fontSize: isLandscape ? 14 : 16,
                                    color: Colors.grey.shade600),
                              )
                            ],
                          ))
                        : filteredStudents.isEmpty
                            ? Center(
                                child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                      selectedSection == null
                                          ? Icons.people_outline
                                          : Icons.filter_alt_outlined,
                                      color: color,
                                      size: isLandscape ? 36 : 48),
                                  const SizedBox(height: 8),
                                  Text(
                                    selectedSection == null
                                        ? 'No students in this class'
                                        : 'No students in this section',
                                    style: TextStyle(
                                        fontSize: isLandscape ? 14 : 16,
                                        color: Colors.grey.shade600),
                                  )
                                ],
                              ))
                            : ListView.separated(
                                itemCount: filteredStudents.length,
                                separatorBuilder: (_, __) =>
                                    const SizedBox(height: 8),
                                itemBuilder: (_, idx) {
                                  final s = filteredStudents[idx];
                                  return Card(
                                    elevation: 3,
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(12)),
                                    child: ListTile(
                                      leading: CircleAvatar(
                                          child:
                                              Icon(Icons.person, color: color)),
                                      title: Text(s.name,
                                          style: TextStyle(
                                              fontWeight: FontWeight.w600,
                                              color: color)),
                                      subtitle: Text(
                                          'Class: ${s.className} • Section: ${s.section}',
                                          style: TextStyle(
                                              color: Colors.grey.shade600)),
                                      trailing: Icon(Icons.arrow_forward,
                                          color: color),
                                      onTap: () => _openFeePage(s),
                                    ),
                                  );
                                },
                              ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class StudentModel {
  final String id, name, classId, className, section;
  StudentModel({
    required this.id,
    required this.name,
    required this.classId,
    required this.className,
    required this.section,
  });
}
