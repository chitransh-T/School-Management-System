import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:transparent_image/transparent_image.dart';
import 'package:sms/widgets/custom_appbar.dart';

class EventImage {
  final int id;
  final String title;
  final String imageUrl;
  final String createdAt;

  EventImage({
    required this.id,
    required this.title,
    required this.imageUrl,
    required this.createdAt,
  });

  factory EventImage.fromJson(Map<String, dynamic> json, String baseUrl) {
    return EventImage(
      id: json['id'] ?? 0,
      title: json['title'] ?? 'Untitled',
      imageUrl: '$baseUrl${json['image_url'] ?? ''}',
      createdAt: json['created_at'] ?? DateTime.now().toIso8601String(),
    );
  }
}

class EventGalleryPage extends StatefulWidget {
  const EventGalleryPage({super.key});

  @override
  State<EventGalleryPage> createState() => _EventGalleryPageState();
}

class _EventGalleryPageState extends State<EventGalleryPage> {
  final String baseUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';
  bool _loading = true;
  String _error = '';
  List<EventImage> _images = [];
  EventImage? _selectedImage;
  String _selectedFilter = 'All Images';
  DateTime? _selectedDate;
  List<String> _uniqueTitles = [];

  @override
  void initState() {
    super.initState();
    fetchEventImages();
  }

  Future<void> fetchEventImages() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) throw Exception('Authentication token not found.');

      final res = await http.get(
        Uri.parse('$baseUrl/api/parent/event-images'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      final data = jsonDecode(res.body);
      if (res.statusCode != 200 || data['success'] != true) {
        throw Exception(data['message'] ?? 'Failed to load images.');
      }

      final List list = data['data'] ?? [];
      setState(() {
        _images = list.map((e) => EventImage.fromJson(e, baseUrl)).toList();
        _uniqueTitles = _images.map((e) => e.title).toSet().toList();
        _uniqueTitles.insert(0, 'All Images');
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Error loading images: ${e.toString()}';
        _loading = false;
      });
    }
  }

  Future<bool> _requestStoragePermission() async {
    if (Platform.isAndroid) {
      final status = await Permission.manageExternalStorage.request();
      if (status.isGranted) {
        return true;
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
                'Storage permission is required. Please enable it in settings.'),
          ),
        );
        openAppSettings();
        return false;
      }
    }
    return true; // For iOS (not needed)
  }

  Future<void> downloadImage(EventImage image) async {
    try {
      final hasPermission = await _requestStoragePermission();
      if (!hasPermission) return;

      final response = await http.get(Uri.parse(image.imageUrl));
      if (response.statusCode != 200) {
        throw Exception('Failed to download image from server.');
      }

      final directory = Directory('/storage/emulated/0/Pictures/EventGallery');
      if (!await directory.exists()) {
        await directory.create(recursive: true);
      }

      final fileName =
          '${image.title}_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final filePath = '${directory.path}/$fileName';
      final file = File(filePath);

      await file.writeAsBytes(response.bodyBytes);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('✅ Image saved to Gallery:\n$filePath')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('❌ Failed to download image: $error')),
      );
    }
  }

  List<EventImage> getFilteredImages() {
    return _images.where((img) {
      final matchTitle =
          _selectedFilter == 'All Images' || img.title == _selectedFilter;
      final matchDate = _selectedDate == null ||
          DateFormat('yyyy-MM-dd').format(DateTime.parse(img.createdAt)) ==
              DateFormat('yyyy-MM-dd').format(_selectedDate!);
      return matchTitle && matchDate;
    }).toList();
  }

  List<String> getTitlesForSelectedDate() {
    if (_selectedDate == null) return _uniqueTitles;

    final titles = _images
        .where((img) {
          final matchDate = _selectedDate == null ||
              DateFormat('yyyy-MM-dd').format(DateTime.parse(img.createdAt)) ==
                  DateFormat('yyyy-MM-dd').format(_selectedDate!);
          return matchDate;
        })
        .map((e) => e.title)
        .toSet()
        .toList();

    titles.insert(0, 'All Images');
    return titles;
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Theme.of(context).primaryColor,
              onPrimary: Colors.white,
              onSurface: Colors.black87,
            ),
            textButtonTheme: TextButtonThemeData(
              style: TextButton.styleFrom(
                foregroundColor: Theme.of(context).primaryColor,
              ),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
        _selectedFilter = 'All Images';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: 'Event Gallery'),
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title filter
                if (getTitlesForSelectedDate().isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12.0),
                    child: DropdownButtonFormField<String>(
                      value: _selectedFilter,
                      items: getTitlesForSelectedDate().map((String title) {
                        return DropdownMenuItem<String>(
                          value: title,
                          child: Text(
                            title,
                            style: const TextStyle(fontSize: 14),
                            overflow: TextOverflow.ellipsis,
                          ),
                        );
                      }).toList(),
                      onChanged: (String? newValue) {
                        setState(() {
                          _selectedFilter = newValue ?? 'All Images';
                        });
                      },
                      decoration: InputDecoration(
                        labelText: 'Filter by Event',
                        labelStyle: TextStyle(
                          color: Theme.of(context).primaryColor,
                          fontWeight: FontWeight.w600,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        filled: true,
                        fillColor: Colors.grey[100],
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                      ),
                      isExpanded: true,
                    ),
                  ),
                // Date filter
                Padding(
                  padding: const EdgeInsets.only(bottom: 12.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          _selectedDate == null
                              ? 'Select Date'
                              : 'Date: ${DateFormat('MMM dd, yyyy').format(_selectedDate!)}',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: _selectedDate == null
                                ? Colors.grey[600]
                                : Colors.black87,
                          ),
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () => _selectDate(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Theme.of(context).primaryColor,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                        ),
                        child: const Text(
                          'Pick Date',
                          style: TextStyle(fontSize: 14),
                        ),
                      ),
                      if (_selectedDate != null)
                        IconButton(
                          icon: const Icon(Icons.clear, color: Colors.grey),
                          onPressed: () {
                            setState(() {
                              _selectedDate = null;
                              _selectedFilter = 'All Images';
                            });
                          },
                        ),
                    ],
                  ),
                ),
                Expanded(
                  child: _loading
                      ? const Center(child: CircularProgressIndicator())
                      : _error.isNotEmpty
                          ? Center(
                              child: Text(
                                _error,
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.error,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            )
                          : getFilteredImages().isEmpty
                              ? Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.photo_library_outlined,
                                        size: 64,
                                        color: Colors.grey[400],
                                      ),
                                      const SizedBox(height: 16),
                                      Text(
                                        'No images found for selected filter',
                                        style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w500,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                              : GridView.builder(
                                  gridDelegate:
                                      const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 3,
                                    crossAxisSpacing: 8,
                                    mainAxisSpacing: 8,
                                    childAspectRatio: 0.8,
                                  ),
                                  itemCount: getFilteredImages().length,
                                  itemBuilder: (context, index) {
                                    final img = getFilteredImages()[index];
                                    return GestureDetector(
                                      onTap: () =>
                                          setState(() => _selectedImage = img),
                                      child: Card(
                                        elevation: 2,
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(12),
                                        ),
                                        child: Stack(
                                          children: [
                                            Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.stretch,
                                              children: [
                                                Expanded(
                                                  child: ClipRRect(
                                                    borderRadius:
                                                        const BorderRadius
                                                            .vertical(
                                                            top:
                                                                Radius.circular(
                                                                    12)),
                                                    child: FadeInImage
                                                        .memoryNetwork(
                                                      placeholder:
                                                          kTransparentImage,
                                                      image: img.imageUrl,
                                                      fit: BoxFit.cover,
                                                      fadeInDuration:
                                                          const Duration(
                                                              milliseconds:
                                                                  300),
                                                      imageErrorBuilder:
                                                          (context, error,
                                                                  stackTrace) =>
                                                              Container(
                                                        color: Colors.grey[200],
                                                        child: const Icon(
                                                          Icons.broken_image,
                                                          size: 40,
                                                          color: Colors.grey,
                                                        ),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                                Padding(
                                                  padding:
                                                      const EdgeInsets.all(6.0),
                                                  child: Column(
                                                    crossAxisAlignment:
                                                        CrossAxisAlignment
                                                            .start,
                                                    children: [
                                                      Text(
                                                        img.title,
                                                        style: const TextStyle(
                                                          fontSize: 12,
                                                          fontWeight:
                                                              FontWeight.w600,
                                                        ),
                                                        maxLines: 1,
                                                        overflow: TextOverflow
                                                            .ellipsis,
                                                      ),
                                                      Text(
                                                        DateFormat(
                                                                'MMM dd, yyyy')
                                                            .format(DateTime
                                                                .parse(img
                                                                    .createdAt)),
                                                        style: TextStyle(
                                                          fontSize: 10,
                                                          color:
                                                              Colors.grey[600],
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ],
                                            ),
                                            Positioned(
                                              top: 4,
                                              right: 4,
                                              child: GestureDetector(
                                                onTap: () => downloadImage(img),
                                                child: Container(
                                                  decoration: BoxDecoration(
                                                    color: Theme.of(context)
                                                        .primaryColor
                                                        .withAlpha(229),
                                                    shape: BoxShape.circle,
                                                  ),
                                                  padding:
                                                      const EdgeInsets.all(6),
                                                  child: const Icon(
                                                    Icons.download,
                                                    size: 16,
                                                    color: Colors.white,
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                ),
                ),
              ],
            ),
          ),
          if (_selectedImage != null)
            Dialog.fullscreen(
              backgroundColor: Colors.black.withAlpha(242),
              child: Stack(
                children: [
                  Center(
                    child: InteractiveViewer(
                      panEnabled: true,
                      minScale: 0.5,
                      maxScale: 4,
                      child: FadeInImage.memoryNetwork(
                        placeholder: kTransparentImage,
                        image: _selectedImage!.imageUrl,
                        fit: BoxFit.contain,
                        fadeInDuration: const Duration(milliseconds: 300),
                        imageErrorBuilder: (context, error, stackTrace) =>
                            const Icon(
                          Icons.broken_image,
                          size: 50,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 16,
                    left: 16,
                    child: SafeArea(
                      child: IconButton(
                        icon: const Icon(Icons.close, size: 32),
                        color: Colors.white,
                        onPressed: () => setState(() => _selectedImage = null),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 16,
                    right: 16,
                    child: FloatingActionButton(
                      heroTag: 'download_fullscreen',
                      backgroundColor: Theme.of(context).primaryColor,
                      onPressed: () => downloadImage(_selectedImage!),
                      child: const Icon(Icons.download, color: Colors.white),
                    ),
                  ),
                  Positioned(
                    bottom: 16,
                    left: 16,
                    right: 16,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      color: Colors.black54,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _selectedImage!.title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            DateFormat('MMM dd, yyyy').format(
                                DateTime.parse(_selectedImage!.createdAt)),
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
