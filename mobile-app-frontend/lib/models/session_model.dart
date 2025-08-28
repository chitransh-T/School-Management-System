// ----------------- MODEL -----------------
class Session {
  final int id;
  final String sessionName;
  final String startDate;
  final String endDate;
  final bool isActive;

  Session({
    required this.id,
    required this.sessionName,
    required this.startDate,
    required this.endDate,
    required this.isActive,
  });

  factory Session.fromJson(Map<String, dynamic> json) {
    String formatDate(String rawDate) {
      try {
        return DateTime.parse(rawDate)
            .toLocal()
            .toIso8601String()
            .split('T')[0];
      } catch (e) {
        return rawDate; // fallback
      }
    }

    return Session(
      id: json['id'],
      sessionName: json['session_name'],
      startDate: formatDate(json['start_date']),
      endDate: formatDate(json['end_date']),
      isActive: json['is_active'],
    );
  }
}
