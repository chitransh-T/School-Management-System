import 'package:flutter/material.dart';

class SchoolHeader extends StatelessWidget {
  final String? instituteName;
  final String? logoUrl;
  final double logoSize;

  const SchoolHeader({
    super.key,
    required this.instituteName,
    required this.logoUrl,
    this.logoSize = 72,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.deepPurple[50],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            if (logoUrl != null && logoUrl!.isNotEmpty)
              ClipOval(
                child: Image.network(
                  logoUrl!,
                  width: logoSize,
                  height: logoSize,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    debugPrint('Error loading logo: $error');
                    return Container(
                      width: logoSize,
                      height: logoSize,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.deepPurpleAccent,
                      ),
                      child: Icon(
                        Icons.school,
                        size: logoSize / 2,
                        color: Colors.white,
                      ),
                    );
                  },
                ),
              )
            else
              Container(
                width: logoSize,
                height: logoSize,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.deepPurpleAccent,
                ),
                child: Icon(
                  Icons.school,
                  size: logoSize / 2,
                  color: Colors.white,
                ),
              ),
            const SizedBox(height: 8),
            Text(
              instituteName ?? 'ALMANET SCHOOL',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.deepPurple[900],
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Excellence in Education',
              style: TextStyle(
                fontSize: 14,
                color: Colors.deepPurple[900],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
