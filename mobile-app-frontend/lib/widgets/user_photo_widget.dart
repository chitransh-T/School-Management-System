// user_photo_widget.dart
import 'package:flutter/material.dart';

Widget buildUserPhoto(String? photoData, String baseUrl) {
  if (photoData == null || photoData.isEmpty) {
    return _buildDefaultAvatar();
  }

  final cleanPhotoPath = photoData.replaceAll('\\', '/').split('/').last;
  final cleanBaseUrl = baseUrl.endsWith('/')
      ? baseUrl.substring(0, baseUrl.length - 1)
      : baseUrl;
  final fullUrl = '$cleanBaseUrl/$cleanPhotoPath';

  return SizedBox(
    width: 60,
    height: 60,
    child: CircleAvatar(
      radius: 30,
      backgroundImage: NetworkImage(fullUrl),
      onBackgroundImageError: (exception, stackTrace) {
        // Optionally log or handle error here
      },
      backgroundColor: Colors.grey[300],
      child: photoData.isNotEmpty ? null : Icon(Icons.person),
    ),
  );
}

Widget _buildDefaultAvatar() {
  return CircleAvatar(
    radius: 30,
    backgroundColor: Colors.grey[300],
    child: Icon(Icons.person, color: Colors.grey[600]),
  );
}
