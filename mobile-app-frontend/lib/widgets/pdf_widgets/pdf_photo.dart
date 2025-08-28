import 'package:flutter/material.dart';

class ProfilePhoto extends StatelessWidget {
  final String photoUrl;
  final String baseUrl;
  final double size;

  const ProfilePhoto({
    super.key,
    required this.photoUrl,
    required this.baseUrl,
    this.size = 120,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: const CircleBorder(),
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: Colors.deepPurple[200]!, width: 2),
        ),
        child: ClipOval(
          child: photoUrl.isNotEmpty
              ? Image.network(
                  photoUrl.startsWith('http')
                      ? photoUrl
                      : '$baseUrl/Uploads/$photoUrl',
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Icon(
                    Icons.person,
                    size: size / 2.5,
                    color: Colors.deepPurple[900],
                  ),
                )
              : Icon(
                  Icons.person,
                  size: size / 2.5,
                  color: Colors.deepPurple[900],
                ),
        ),
      ),
    );
  }
}
