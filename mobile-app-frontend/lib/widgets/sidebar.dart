import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/pages/auth/login.dart';
import 'package:sms/pages/parents_dashboard/event_gallery.dart';
import 'package:sms/pages/parents_dashboard/receive_message.dart';
import 'package:sms/pages/parents_dashboard/sent_message.dart';
import 'package:sms/pages/parents_dashboard/student_fee.dart';
import 'package:sms/pages/parents_dashboard/view_attendance.dart';
import 'package:sms/pages/parents_dashboard/view_homework.dart';
import 'package:sms/pages/principle/event_images_page.dart';
import 'package:sms/pages/teacher_dashboard/view_homework_page.dart';
import 'package:sms/pages/teacher_dashboard/add_homework.dart';
import 'package:sms/pages/teacher_dashboard/attendance_report.dart';
import 'package:sms/pages/teacher_dashboard/event_image.dart';
import 'package:sms/pages/teacher_dashboard/p_receive_mess.dart';
import 'package:sms/pages/teacher_dashboard/p_send_message.dart';
import 'package:sms/pages/teacher_dashboard/t_view_message.dart';
import 'package:sms/pages/teacher_dashboard/take_attendance.dart';
import 'package:sms/pages/teacher_dashboard/view_event_img.dart';
import 'package:sms/pages/assign_teacher_class_subjects/assign_teacher.dart';
import 'package:sms/pages/assign_teacher_class_subjects/view_teacher_assign.dart';
import 'package:sms/pages/session/session.dart';
import 'package:sms/pages/session/manage_session.dart';
import 'package:sms/pages/student/admission/admission_letter.dart';
import 'package:sms/pages/classes/all_class.dart';
import 'package:sms/pages/classes/new_class.dart';
import 'package:sms/pages/student/student_attendance/student_attendance.dart';
import 'package:sms/pages/student/student_details/student_details.dart';
import 'package:sms/pages/student/student_registration/student_registration_page.dart';
import 'package:sms/pages/student/student_report/student_reports.dart';
import 'package:sms/pages/subjects/assign_subjects.dart';
import 'package:sms/pages/subjects/class_with_subjects.dart';
import 'package:sms/pages/teacher/Job_letter/job_letter.dart';
import 'package:sms/pages/teacher/teacher_attendance/teacher_attendance.dart';
import 'package:sms/pages/teacher/teacher_details/teacher_details.dart';
import 'package:sms/pages/teacher/teacher_registration/teacher_registration.dart';
import 'package:sms/pages/teacher/teacher_report/teacher_report.dart';
import 'package:sms/pages/notices/notice.dart';
import 'package:sms/pages/fees/fee_master.dart';
import 'package:sms/pages/fees/fee_structure.dart';
import 'package:sms/pages/fees/view_fee_structure.dart';
import 'package:sms/pages/fees/fees_student_search.dart';

class Sidebar extends StatelessWidget {
  final String userType; // 'principal', 'teacher', or 'parent'
  final String? userName;
  final String? profileImageUrl;
  final String? instituteName;
  final String? instituteAddress;
  final double avatarRadius;
  final List<Map<String, dynamic>>? menuItems;

  const Sidebar({
    super.key,
    required this.userType,
    this.userName,
    this.profileImageUrl,
    this.instituteName,
    this.instituteAddress,
    this.avatarRadius = 40,
    this.menuItems,
  });

  @override
  Widget build(BuildContext context) {
    final List<Map<String, dynamic>> items =
        menuItems ?? _getDefaultMenuItems();

    return Drawer(
      width: MediaQuery.of(context).size.width * 0.7,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
      ),
      child: Column(
        children: [
          // Header Section
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.deepPurple, Colors.deepPurpleAccent],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.only(
                topRight: Radius.circular(20),
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircleAvatar(
                  radius: avatarRadius,
                  backgroundColor: Colors.grey[200],
                  backgroundImage: profileImageUrl != null
                      ? NetworkImage(profileImageUrl!)
                      : const AssetImage('assets/images/student_default.png')
                          as ImageProvider,
                ),
                const SizedBox(height: 10),
                Text(
                  userName ??
                      (userType == 'principal'
                          ? 'Principal'
                          : userType == 'teacher'
                              ? 'Teacher'
                              : 'Parent'),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (instituteName != null) ...[
                  const SizedBox(height: 5),
                  Text(
                    instituteName!,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                if (instituteAddress != null) ...[
                  const SizedBox(height: 5),
                  Text(
                    instituteAddress!,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),

          // Menu Items Section
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                ...items.map((item) {
                  if (item['isExpansionTile'] == true) {
                    return _buildExpansionMenuItem(context, item);
                  } else {
                    return _buildMenuItem(context, item);
                  }
                }),
                const Divider(height: 20, thickness: 1),
                _buildLogoutItem(context),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(BuildContext context, Map<String, dynamic> item) {
    return ListTile(
      leading: Icon(
        item['icon'],
        color: Colors.deepPurple,
      ),
      title: Text(
        item['title'],
        style: const TextStyle(
          color: Colors.black87,
          fontWeight: FontWeight.w500,
        ),
      ),
      onTap: () {
        Navigator.pop(context);
        if (item['route'] != null) {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => item['route']),
          );
        }
      },
    );
  }

  Widget _buildExpansionMenuItem(
      BuildContext context, Map<String, dynamic> item) {
    return ExpansionTile(
      leading: Icon(
        item['icon'],
        color: Colors.deepPurple,
      ),
      title: Text(
        item['title'],
        style: const TextStyle(
          color: Colors.black87,
          fontWeight: FontWeight.w500,
        ),
      ),
      children: (item['children'] as List<Map<String, dynamic>>)
          .map((childItem) => _buildMenuItem(context, childItem))
          .toList(),
    );
  }

  Widget _buildLogoutItem(BuildContext context) {
    return ListTile(
      leading: const Icon(
        Icons.logout,
        color: Colors.deepPurple,
      ),
      title: const Text(
        "Logout",
        style: TextStyle(
          color: Colors.black87,
          fontWeight: FontWeight.w500,
        ),
      ),
      onTap: () => _confirmLogout(context),
    );
  }

  Future<void> _confirmLogout(BuildContext context) async {
    bool? shouldLogout = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Confirm Logout"),
        content: const Text("Are you sure you want to logout?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text("No"),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text("Yes"),
          ),
        ],
      ),
    );

    if (shouldLogout == true) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
      if (context.mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const LoginPage()),
        );
      }
    }
  }

  List<Map<String, dynamic>> _getDefaultMenuItems() {
    switch (userType) {
      case 'principal':
        return [
          {
            'title': 'Dashboard',
            'icon': Icons.dashboard,
            'route': null,
            'isExpansionTile': false,
          },
          {
            'title': 'Session',
            'icon': Icons.calendar_today,
            'isExpansionTile': true,
            'children': [
              {
                'title': 'Create Session',
                'icon': Icons.note_add_outlined,
                'route': CreateSessionPage(),
              },
              {
                'title': 'Manage Session',
                'icon': Icons.manage_accounts,
                'route': ManageSessionsPage(),
              },
            ],
          },
          {
            'title': 'Teacher',
            'icon': Icons.person,
            'isExpansionTile': true,
            'children': [
              {
                'title': 'Add New Teacher',
                'icon': Icons.add,
                'route': TeacherRegistrationPage(
                  onTeacherRegistered: () {},
                ),
              },
              {
                'title': 'View Teacher Details',
                'icon': Icons.view_agenda_rounded,
                'route': TeacherProfileManagementPage(),
              },
              {
                'title': 'Teacher Attendance',
                'icon': Icons.calendar_month,
                'route': TeacherAttendancePage(),
              },
              {
                'title': 'Teacher Reports',
                'icon': Icons.report,
                'route': TeacherReportPage(),
              },
              {
                'title': 'Job Letter',
                'icon': Icons.report,
                'route': TeacherAdmissionLetterPage(),
              },
            ],
          },
          {
            'title': 'Classes',
            'icon': Icons.class_,
            'isExpansionTile': true,
            'children': [
              {
                'title': 'New Class',
                'icon': Icons.add,
                'route': AddClassPage(),
              },
              {
                'title': 'All Classes',
                'icon': Icons.view_agenda_rounded,
                'route': AllClassesPage(),
              },
            ],
          },
          {
            'title': 'Subjects',
            'icon': Icons.subject,
            'isExpansionTile': true,
            'children': [
              {
                'title': 'Assign Subjects',
                'icon': Icons.view_agenda_rounded,
                'route': AssignSubjectPage(),
              },
              {
                'title': 'Classes with Subjects',
                'icon': Icons.add,
                'route': ClassWithSubjectsPage(),
              },
            ],
          },
          {
            'title': 'Subjects Assign',
            'icon': Icons.class_,
            'isExpansionTile': true,
            'children': [
              {
                'title': 'Assign Teacher',
                'icon': Icons.add,
                'route': AssignTeacherPage(),
              },
              {
                'title': 'View Assigned Teachers',
                'icon': Icons.view_agenda_rounded,
                'route': ViewTeacherAssignmentsPage(),
              },
            ],
          },
          {
            'title': 'Students',
            'icon': Icons.school,
            'isExpansionTile': true,
            'children': [
              {
                'title': 'Add New Student',
                'icon': Icons.add,
                'route': StudentRegistrationPage(
                  onStudentRegistered: () {},
                ),
              },
              {
                'title': 'View Student Details',
                'icon': Icons.view_agenda_rounded,
                'route': StudentProfileManagementPage(),
              },
              {
                'title': 'Student Attendance',
                'icon': Icons.calendar_month,
                'route': StudentAttendancePage(),
              },
              {
                'title': 'Student Reports',
                'icon': Icons.report,
                'route': StudentReportPage(),
              },
              {
                'title': 'Admission Letter',
                'icon': Icons.insert_drive_file,
                'route': AdmissionLetterPage(),
              },
            ],
          },
          {
            'title': 'Fees',
            'icon': Icons.payment,
            'isExpansionTile': true,
            'children': [
              {
                'title': 'Collect Fees',
                'icon': Icons.add,
                'route': FeeCollectPage(),
              },
              {
                'title': 'Fee Master',
                'icon': Icons.add,
                'route': FeeMasterPage(),
              },
              {
                'title': 'Fee Structure',
                'icon': Icons.add,
                'route': FeeStructurePage(),
              },
              {
                'title': 'View Fee Structure',
                'icon': Icons.add,
                'route': ViewFeeStructurePage(),
              },
            ],
          },
          {
            'title': 'Notices',
            'icon': Icons.announcement,
            'route': NoticesPage(),
            'isExpansionTile': false,
          },
          {
            'title': 'Event Images',
            'icon': Icons.image,
            'route': PrincipalEventImagesPage(),
            'isExpansionTile': false,
          },
        ];
      case 'teacher':
        return [
          {
            'title': 'Dashboard',
            'icon': Icons.dashboard,
            'route': null,
            'isExpansionTile': false,
          },
          {
            'title': 'Event Images',
            'icon': Icons.camera_alt_outlined,
            'route': EventImageUploadPage(),
            'isExpansionTile': false,
          },
          {
            'title': 'View Event Images',
            'icon': Icons.photo_library,
            'route': TeacherEventImagesPage(),
            'isExpansionTile': false,
          },
          {
            'title': 'Take Attendance',
            'icon': Icons.check_circle_outline,
            'route': const TakeAttendancePage(),
            'isExpansionTile': false,
          },
          {
            'title': 'Attendance Report',
            'icon': Icons.assignment_turned_in,
            'route': const AttendanceReportPage(),
            'isExpansionTile': false,
          },
          {
            'title': 'Add Homework',
            'icon': Icons.home_work,
            'route': AddHomeworkPage(),
            'isExpansionTile': false,
          },
          {
            'title': 'View Homework',
            'icon': Icons.menu_book,
            'route': ViewTeacherHomeworkPage(),
            'isExpansionTile': false,
          },
          {
            'title': 'Send Message',
            'icon': Icons.outbox,
            'route': SendMessagePage(),
            'isExpansionTile': false,
          },
          {
            'title': 'View Message',
            'icon': Icons.mark_email_read,
            'route': ViewSentMessagesPage(),
            'isExpansionTile': false,
          },
          {
            'title': 'Receive Message',
            'icon': Icons.mark_email_unread,
            'route': ViewReceivedMessagesPage(),
            'isExpansionTile': false,
          },
        ];
      case 'parent':
      default:
        return [
          {
            'title': 'Dashboard',
            'icon': Icons.dashboard,
            'route': null,
            'isExpansionTile': false,
          },
          {
            'title': 'View Homework',
            'icon': Icons.book,
            'route': const ViewHomeworkPage(),
            'isExpansionTile': false,
          },
          {
            'title': 'View Attendance',
            'icon': Icons.fact_check,
            'route': ViewAttendance(),
            'isExpansionTile': false,
          },
          {
            'title': 'Send Message',
            'icon': Icons.send,
            'route': SendTextPage(),
            'isExpansionTile': false,
          },
          {
            'title': 'Receive Message',
            'icon': Icons.message,
            'route': ViewMessagesPage(),
            'isExpansionTile': false,
          },
          {
            'title': 'Event Gallery',
            'icon': Icons.photo_library,
            'route': EventGalleryPage(),
            'isExpansionTile': false,
          },
          {
            'title': 'Fee Record',
            'icon': Icons.receipt,
            'route': StudentFeeRecord(),
            'isExpansionTile': false,
          },
        ];
    }
  }
}
