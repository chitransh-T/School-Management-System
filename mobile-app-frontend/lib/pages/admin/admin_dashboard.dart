import 'package:flutter/material.dart';
import 'package:sms/pages/auth/signup.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms/pages/auth/login.dart';

class AdminDashboard extends StatefulWidget {
  const AdminDashboard({super.key});

  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  int totalStudents = 0; // Student count initialized at 0
  int totalTeachers = 0;
  bool isLoading = false; // To show loading state
  String? userEmail;
  // static final String baseeUrl = dotenv.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    setState(() => isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      setState(() {
        userEmail = prefs.getString('user_email'); // This should set the value
      });
      if (userEmail != null) {
        // await _fetchCounts();
      }
    } catch (e) {
      // handle error
    } finally {
      setState(() => isLoading = false);
    }
  }

  // Function to handle logout
  Future<void> _logout() async {
    // Show confirmation dialog
    bool? shouldLogout = await _showLogoutConfirmationDialog();

    if (shouldLogout != null && shouldLogout) {
      setState(() {
        isLoading = true; // Show loading spinner
      });

      // Simulate a delay (you can replace it with real API logout if needed)
      await Future.delayed(const Duration(seconds: 1));

      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token'); // Clear the token from local storage

      // Navigate to the login page after delay
      Navigator.pushReplacement(
        // ignore: use_build_context_synchronously
        context,
        MaterialPageRoute(
          builder: (context) => const LoginPage(),
        ),
      );
    }
  }

  // Show confirmation dialog for logout
  Future<bool?> _showLogoutConfirmationDialog() {
    return showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text("Confirm Logout"),
          content: const Text("Are you sure you want to logout?"),
          actions: <Widget>[
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(false); // User chose "No"
              },
              child: const Text("No"),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(true); // User chose "Yes"
              },
              child: const Text("Yes"),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue.shade900,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: _logout, // Call logout function
          ),
        ],
      ),
      drawer: Drawer(
        child: Column(
          children: [
            // Full-width header
            Container(
              width: double.infinity,
              color: Colors.blue.shade900,
              child: DrawerHeader(
                margin: EdgeInsets.zero,
                padding: EdgeInsets.zero,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundImage: AssetImage('assets/images/almanet1.jpg'),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      "Almanet Dashboard",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Scrollable content
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  ListTile(
                    leading: const Icon(Icons.dashboard, color: Colors.black87),
                    title: const Text(
                      "Dashboard",
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    onTap: () {
                      Navigator.pop(context); // Close drawer
                      Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(
                            builder: (context) => const AdminDashboard()),
                      );
                    },
                  ),
                  ExpansionTile(
                    leading: const Icon(Icons.class_, color: Colors.black87),
                    title: const Text("Signup",
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold)),
                    children: [
                      ListTile(
                        leading: const Icon(Icons.add, color: Colors.black54),
                        title: const Text("Add user"),
                        onTap: () {
                          Navigator.pop(context);
                          Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (context) => SignUpPage()));
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Admin Dashboard",
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
