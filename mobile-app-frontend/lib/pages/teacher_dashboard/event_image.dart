import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/pages/teacher_dashboard/t_dashboard.dart';
import 'package:sms/widgets/button.dart';
import 'package:sms/widgets/custom_appbar.dart';
import 'package:sms/widgets/custom_snackbar.dart';

class EventImageUploadPage extends StatefulWidget {
  const EventImageUploadPage({super.key});

  @override
  State<EventImageUploadPage> createState() => _EventImageUploadPageState();
}

class _EventImageUploadPageState extends State<EventImageUploadPage> {
  final ImagePicker _picker = ImagePicker();
  List<XFile> _images = [];
  String _title = '';
  String _error = '';
  bool _loading = false;
  int? _classId;

  static final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: 'Upload Event Images'),
      body: Stack(
        children: [
          SingleChildScrollView(
            // 👈 Wrap with scroll view
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Event Title',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.deepPurple[700],
                      ),
                ),
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.grey.withAlpha(25),
                        spreadRadius: 2,
                        blurRadius: 5,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: TextField(
                    decoration: const InputDecoration(
                      hintText: 'Enter event title...',
                      border: InputBorder.none,
                      contentPadding:
                          EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    ),
                    style: Theme.of(context).textTheme.bodyLarge,
                    onChanged: (v) => setState(() => _title = v),
                  ),
                ),
                const SizedBox(height: 20),

                /// Image selection
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'Event Images',
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                    color: Colors.deepPurple[700],
                                  ),
                        ),
                        const SizedBox(height: 12),
                        if (_images.isEmpty)
                          Container(
                            height: 120,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: Colors.grey.shade300,
                                width: 1.5,
                              ),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.image_outlined,
                                    size: 40, color: Colors.grey.shade400),
                                const SizedBox(height: 8),
                                Text('No images selected',
                                    style:
                                        TextStyle(color: Colors.grey.shade500)),
                              ],
                            ),
                          )
                        else
                          SizedBox(
                            height: 120,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: _images.length,
                              itemBuilder: (context, index) {
                                final file = _images[index];
                                return Padding(
                                  padding: const EdgeInsets.only(right: 8),
                                  child: kIsWeb
                                      ? _buildWebImagePreview(file, index)
                                      : _buildMobileImagePreview(file, index),
                                );
                              },
                            ),
                          ),
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          icon: const Icon(Icons.add_photo_alternate_outlined),
                          label: const Text('Select Images'),
                          onPressed: pickImages,
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            side: BorderSide(
                              color: Theme.of(context).primaryColor,
                              width: 1.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                Align(
                  alignment: Alignment.center,
                  child: CustomButton(
                    text: _loading ? 'Uploading...' : 'Upload Event',
                    icon: Icons.cloud_upload_outlined,
                    isLoading: _loading,
                    width: 200,
                    height: 50,
                    onPressed:
                        (_loading || _title.trim().isEmpty || _images.isEmpty)
                            ? null
                            : uploadImages,
                  ),
                ),

                const SizedBox(height: 8),
                if (_error.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Text(
                      _error,
                      style: TextStyle(
                        color: Colors.red.shade700,
                        fontSize: 14,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWebImagePreview(XFile file, int index) {
    return Stack(
      children: [
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            image: DecorationImage(
              image: NetworkImage(file.path),
              fit: BoxFit.cover,
            ),
          ),
        ),
        Positioned(
          top: 4,
          right: 4,
          child: GestureDetector(
            onTap: () => setState(() => _images.removeAt(index)),
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.black54,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, color: Colors.white, size: 18),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMobileImagePreview(XFile file, int index) {
    return Stack(
      children: [
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            image: DecorationImage(
              image: FileImage(File(file.path)),
              fit: BoxFit.cover,
            ),
          ),
        ),
        Positioned(
          top: 4,
          right: 4,
          child: GestureDetector(
            onTap: () => setState(() => _images.removeAt(index)),
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.black54,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, color: Colors.white, size: 18),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> pickImages() async {
    try {
      final picked = await _picker.pickMultiImage(imageQuality: 85);
      if (picked.isNotEmpty) {
        setState(() {
          _images = picked;
          _error = '';
        });
      }
    } catch (e) {
      setState(() => _error = 'Failed to pick images: ${e.toString()}');
    }
  }

  Future<void> uploadImages() async {
    setState(() {
      _error = '';
      _loading = true;
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) throw Exception('Authentication token not found');

      final uri = Uri.parse('$baseUrl/api/upload-event-images');
      final request = http.MultipartRequest('POST', uri)
        ..headers['Authorization'] = 'Bearer $token'
        ..fields['title'] = _title;

      if (_classId != null) {
        request.fields['class_id'] = _classId.toString();
      }

      for (final file in _images) {
        if (kIsWeb) {
          final bytes = await file.readAsBytes();
          final multipart = http.MultipartFile.fromBytes(
            'event_images',
            bytes,
            filename: file.name,
          );
          request.files.add(multipart);
        } else {
          final multipart = await http.MultipartFile.fromPath(
            'event_images',
            file.path,
          );
          request.files.add(multipart);
        }
      }

      final streamedRes = await request.send();
      final res = await http.Response.fromStream(streamedRes);

      if (res.statusCode != 200) {
        final errorData = jsonDecode(res.body);
        throw Exception(errorData['message'] ?? 'Upload failed');
      }
      if (!mounted) return;
      showCustomSnackBar(
        context,
        'Images uploaded successfully!',
        backgroundColor: Colors.green.shade600,
      );
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => TeacherDashboard()),
      );
      setState(() {
        _images = [];
        _title = '';
      });
    } catch (e) {
      setState(() => _error = 'Error: ${e.toString()}');
    } finally {
      setState(() => _loading = false);
    }
  }
}
