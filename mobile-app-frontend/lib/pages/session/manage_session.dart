import 'package:flutter/material.dart';
import 'package:sms/pages/services/session_service.dart';
import 'package:sms/pages/session/edit_session.dart';
import 'package:sms/widgets/custom_appbar.dart'; // ✅ Make sure this path is correct
import 'package:sms/models/session_model.dart';
import 'package:sms/widgets/custom_snackbar.dart';

// ----------------- PAGE -----------------
class ManageSessionsPage extends StatefulWidget {
  const ManageSessionsPage({super.key});

  @override
  State<ManageSessionsPage> createState() => _ManageSessionsPageState();
}

class _ManageSessionsPageState extends State<ManageSessionsPage> {
  late Future<List<Session>> futureSessions;

  @override
  void initState() {
    super.initState();
    futureSessions = loadSessions();
  }

  Future<List<Session>> loadSessions() async {
    final result = await SessionService.getSessions();

    if (result['success'] == true) {
      final List<dynamic> sessionList = result['data'];
      return sessionList.map((json) => Session.fromJson(json)).toList();
    } else {
      throw Exception(result['message'] ?? 'Failed to fetch sessions');
    }
  }

  Future<void> deleteSession(int sessionId) async {
    final result = await SessionService.deleteSession(sessionId.toString());
    if (!mounted) return;

    if (result['success'] == true) {
      // ScaffoldMessenger.of(context).showSnackBar(
      //   SnackBar(content: Text('Session deleted successfully')),
      // );
      showCustomSnackBar(context, 'Session deleted successfully',
          backgroundColor: Colors.red);
      setState(() {
        futureSessions = loadSessions();
      });
    } else {
      // ScaffoldMessenger.of(context).showSnackBar(
      //   SnackBar(
      //       content: Text(result['message'] ?? 'Failed to delete session')),
      // );
      showCustomSnackBar(
          context, result['message'] ?? 'Failed to delete session',
          backgroundColor: Colors.red);
    }
  }

  void confirmDelete(int sessionId) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text("Delete Session"),
        content: Text("Are you sure you want to delete this session?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text("Cancel"),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              deleteSession(sessionId);
            },
            child: Text("Delete", style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(title: 'Manage Session'),
      body: FutureBuilder<List<Session>>(
        future: futureSessions,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return Center(child: Text('No sessions found'));
          }
          final sessions = snapshot.data!;
          return ListView.builder(
            itemCount: sessions.length,
            itemBuilder: (context, index) {
              final session = sessions[index];
              return Card(
                  margin: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: ListTile(
                    leading: Icon(
                      session.isActive
                          ? Icons.check_circle
                          : Icons.circle_outlined,
                      color: session.isActive ? Colors.green : Colors.grey,
                    ),
                    title: Text(
                      session.sessionName,
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(height: 4),
                        // Text('Name: ${session.sessionName}'),
                        Text('Start: ${session.startDate}'),
                        Text('End: ${session.endDate}'),
                      ],
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: Icon(Icons.edit, color: Colors.blue),
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    EditSessionDialog(session: session),
                              ),
                            ).then((value) {
                              if (value == true) {
                                setState(() {
                                  futureSessions = loadSessions();
                                });
                              }
                            });
                          },
                        ),
                        IconButton(
                          icon: Icon(Icons.delete, color: Colors.red),
                          onPressed: () => confirmDelete(session.id),
                        ),
                      ],
                    ),
                  ));
            },
          );
        },
      ),
    );
  }
}
