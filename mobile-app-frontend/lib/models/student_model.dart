class Student {
  String id;
  String name;
  String registrationNumber;
  String dateOfBirth;
  String gender;
  String address;
  String fatherName;
  String motherName;
  String email;
  String phone;
  String assignedClass;
  String assignedSection;
  String birthCertificate;
  String studentPhoto;
  DateTime admissionDate;
  String username;
  String password;
  String createdAt;
  bool isPresent;

  Student({
    required this.id,
    required this.name,
    required this.registrationNumber,
    required this.dateOfBirth,
    required this.gender,
    required this.address,
    required this.fatherName,
    required this.motherName,
    required this.email,
    required this.phone,
    required this.assignedClass,
    required this.assignedSection,
    required this.birthCertificate,
    required this.studentPhoto,
    required this.admissionDate,
    required this.username,
    required this.password,
    required this.createdAt,
    this.isPresent = false,
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    final photoData = json['student_photo'];
    final birthCertData = json['birth_certificate'];

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

    return Student(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      name: json['student_name']?.toString() ?? 'Unknown',
      registrationNumber: json['registration_number']?.toString() ?? '',
      dateOfBirth: json['date_of_birth']?.toString() ?? '',
      gender: json['gender']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      fatherName: json['father_name']?.toString() ?? '',
      motherName: json['mother_name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      assignedClass: json['assigned_class']?.toString() ??
          json['class_name']?.toString() ??
          '',
      assignedSection: json['assigned_section']?.toString() ??
          json['section']?.toString() ??
          '',
      studentPhoto: processPath(photoData),
      admissionDate: json['created_at'] != null
          ? DateTime.parse(json['created_at'].toString())
          : DateTime.now(),
      username: json['username']?.toString() ?? 'N/A',
      password: json['password']?.toString() ?? 'N/A',
      birthCertificate: processPath(birthCertData),
      createdAt: json['created_at']?.toString() ?? '',
    );
  }
}
