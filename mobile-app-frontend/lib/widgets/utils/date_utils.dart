// lib/utils/date_utils.dart
import 'package:intl/intl.dart';

String formatTimestamp(String timestamp) {
  try {
    final date = DateTime.parse(timestamp).toLocal();
    return DateFormat('dd MMM yyyy, hh:mm a').format(date);
  } catch (e) {
    return timestamp;
  }
}
