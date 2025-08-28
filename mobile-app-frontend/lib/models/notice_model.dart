class Notice {
  final String id;
  final String title;
  final String content;
  final String noticeDate;
  final String endDate; // <-- new field
  final String category;
  final String priority;
  final String createdAt;

  Notice({
    required this.id,
    required this.title,
    required this.content,
    required this.noticeDate,
    required this.createdAt,
    required this.endDate,
    required this.category,
    required this.priority,
  });

  factory Notice.fromJson(Map<String, dynamic> json) {
    return Notice(
      id: json['id'].toString(),
      title: json['title'],
      content: json['content'],
      noticeDate: json['notice_date'],
      createdAt: json['created_at'] ?? '',
      endDate:
          json['end_date'] ?? '', // safely get end_date, fallback empty string
      category: json['category'],
      priority: json['priority'] ?? 'medium',
    );
  }
}
