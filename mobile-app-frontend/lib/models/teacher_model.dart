class Teacher {
  String id;
  String name;
  String email;
  String password;
  String dateOfBirth;
  String dateOfJoining;
  String gender;
  String guardian_name; // Changed this from guardian_name to guardianName
  String qualification;
  String experience;
  String salary;
  String address;
  String phone;
  String qualificationCertificate;
  String teacherPhoto;
  String createdAt;

  Teacher({
    required this.id,
    required this.name,
    required this.email,
    required this.password,
    required this.dateOfBirth,
    required this.dateOfJoining,
    required this.gender,
    required this.guardian_name, // Changed this from guardian_name to guardianName
    required this.qualification,
    required this.experience,
    required this.salary,
    required this.address,
    required this.phone,
    required this.qualificationCertificate,
    required this.teacherPhoto,
    required this.createdAt,
  });

  factory Teacher.fromJson(Map<String, dynamic> json) {
    final photoData = json['teacher_photo'];
    final qualificationCertData = json['qualification_certificate'];

    String processPath(dynamic data) {
      if (data == null) return '';
      if (data is Map && data['type'] == 'Buffer' && data['data'] is List) {
        return String.fromCharCodes(List<int>.from(data['data']));
      }
      String path = data.toString();
      if (path.contains('uploads\\')) {
        return path.split('uploads\\').last;
      }
      return path;
    }

    return Teacher(
      id: json['id']?.toString() ?? '',
      name: json['teacher_name']?.toString() ?? 'Unknown',
      email: json['username']?.toString() ?? '',
      password: json['password']?.toString() ?? '',
      dateOfBirth: json['date_of_birth']?.toString() ?? '',
      dateOfJoining: json['date_of_joining']?.toString() ?? '',
      gender: json['gender']?.toString() ?? '',
      guardian_name:
          json['guardian_name']?.toString() ?? '', // Updated field name
      qualification: json['qualification']?.toString() ?? '',
      experience: json['experience']?.toString() ?? '',
      salary: json['salary']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      teacherPhoto: processPath(photoData),
      qualificationCertificate: processPath(qualificationCertData),
      createdAt: json['created_at']?.toString() ?? '',
    );
  }
}
