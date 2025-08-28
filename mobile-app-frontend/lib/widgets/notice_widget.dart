import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:sms/models/notice_model.dart';
import 'package:intl/intl.dart'; // <-- Added for date formatting

class NoticeWidget extends StatefulWidget {
  const NoticeWidget({super.key});

  @override
  State<NoticeWidget> createState() => _NoticeWidgetState();
}

class _NoticeWidgetState extends State<NoticeWidget> {
  bool isLoading = false;
  List<Notice> notices = [];
  static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  @override
  void initState() {
    super.initState();
    fetchNotices();
  }

  Future<void> fetchNotices() async {
    setState(() => isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) {
        debugPrint('No token found, cannot fetch notices');
        return;
      }

      final response = await http.get(
        Uri.parse('$baseUrl/api/notices'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);
        final List<dynamic> data = jsonData['data'];
        setState(() {
          notices = data.map((n) => Notice.fromJson(n)).toList();
        });
      } else {
        debugPrint('Failed to fetch notices: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error fetching notices: $e');
    } finally {
      setState(() => isLoading = false);
    }
  }

  // 🔽 Helper to format notice date to local readable time
  String _formatNoticeDate(String isoDate) {
    try {
      final dateTime = DateTime.parse(isoDate).toLocal();
      final formatter = DateFormat('MMMM d, y • h:mm a');
      return formatter.format(dateTime);
    } catch (e) {
      return isoDate;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Notices",
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 10),
        isLoading
            ? const Center(child: CircularProgressIndicator())
            : notices.isEmpty
                ? const Center(child: Text("No notices available."))
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: notices.length,
                    itemBuilder: (context, index) {
                      final notice = notices[index];
                      return Card(
                        elevation: 3,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        margin: const EdgeInsets.only(bottom: 10),
                        child: ExpansionTile(
                          leading: Icon(
                            Icons.notification_important,
                            color: Colors.red.shade700,
                          ),
                          title: Text(
                            notice.title,
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Text(
                              "Posted on ${_formatNoticeDate(notice.createdAt)}"),
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Text(
                                notice.content.isNotEmpty
                                    ? notice.content
                                    : 'No content available.',
                                style: const TextStyle(fontSize: 14),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
      ],
    );
  }
}
