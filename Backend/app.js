import express from 'express';
import bodyparser from 'body-parser';
import cors from 'cors';
import connection from './database/db_connection.js';
import multer from 'multer';
import path from 'path';

const app = express();
const port = 1000;

app.use(cors());
app.use(bodyparser.json());

app.get('/', (req,res)=>{
    res.send("Welcome")
})

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT id, email FROM signup WHERE email = ? AND password = ?';
    connection.query(query, [email, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
        if (results.length > 0) {
            const user = results[0];
            return res.json({ 
                success: true, 
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        }
        else {
            return res.status(400).json({ success: false, message: 'Invalid Credentials' });
        }
    });
});

// Get dashboard data for specific user
app.get('/dashboard/:userId', (req, res) => {
    const userId = req.params.userId;
    
    // Get user-specific dashboard data
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM students WHERE created_by = ?) as total_students,
            (SELECT COUNT(*) FROM attendance WHERE marked_by = ?) as total_attendance_records
        FROM dual`;
    
    connection.query(query, [userId, userId], (err, results) => {
        if (err) {
            console.error('Error fetching dashboard data:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
        
        res.json({
            success: true,
            data: results[0]
        });
    });
});

app.post('/register', (req, res) => {
    const { email, phone, password, confirmpassword } = req.body;
    // Validate inputs
    if (!email || !phone || !password || !confirmpassword) {
        return res.status(400).json({ success: false, message: 'Invalid Credentials' });
    }

    // Check if email already exists
    const checkEmailQuery = 'SELECT * FROM signup WHERE email = ?';
    connection.query(checkEmailQuery, [email], (err, results) => {
        if (err) {
            console.error('Error checking email:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (results.length > 0) {
            // Email already exists
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Insert new user
        const query = 'INSERT INTO signup (email,phone,password,confirmpassword) VALUES (?,?,?,?)';
        connection.query(query, [email, phone, password, confirmpassword], (err, results) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).json({ success: false, message: 'Server error' });
            }

            res.status(200).json({
                success: true,
                message: 'User registered successfully'
            });
        });
    });
});

// Set up multer for file uploads
const upload = multer({
    dest: 'uploads/', // Files will be uploaded to this directory
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB size limit per file
}).fields([
    { name: 'student_photo', maxCount: 1 },
    { name: 'birth_certificate', maxCount: 1 },
]);

// POST API for student registration
// POST API for student registration
app.post('/registerstudent', upload, (req, res) => {
    // Destructure fields from the request body
    const {
        student_name,
        registration_number,
        date_of_birth,
        gender,
        country,
        address,
        assigned_class,
        assigned_section,
        father_name,
        mother_name,
        email,
        phone,
        username,
        password,
        admin_id // Add admin_id to track who created the student
    } = req.body;

    // Validate date_of_birth
    if (!date_of_birth || date_of_birth === 'null') {
        return res.status(400).json({
            success: false,
            message: 'Date of birth is required.',
        });
    }

    // Ensure files exist and get file paths
    const studentPhoto = req.files['student_photo'] ? req.files['student_photo'][0].path : null;
    const birthCertificate = req.files['birth_certificate'] ? req.files['birth_certificate'][0].path : null;

    // Check if both files are provided
    if (!studentPhoto || !birthCertificate) {
        return res.status(400).json({
            success: false,
            message: 'Both student photo and birth certificate are required.',
        });
    }

    // SQL query to insert student data into the database
    const sql = `
    INSERT INTO students (
        student_name,
        registration_number,
        date_of_birth,
        gender,
        country,
        address,
        assigned_class,
        assigned_section,
        father_name,
        mother_name,
        email,
        phone,
        birth_certificate,
        student_photo,
        username,
        password,
        created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    // Insert data into the database
    connection.query(sql, [
        student_name,
        registration_number,
        date_of_birth,
        gender,
        country,
        address,
        assigned_class,
        assigned_section,
        father_name,
        mother_name,
        email,
        phone,
        birthCertificate,
        studentPhoto,
        username,
        password,
        admin_id // Add admin_id to the query parameters
    ], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error registering student' });
        }
        res.status(200).json({ success: true, message: 'Student registered successfully' });
    });
});

// Update the students endpoint to filter by admin_id
app.get('/students', (req, res) => {
    const { class: assignedClass, section, admin_id } = req.query;
    
    let query = 'SELECT * FROM students WHERE created_by = ?';
    let params = [admin_id];
    
    // Filter by class if provided
    if (assignedClass) {
        query += ' AND assigned_class = ?';
        params.push(assignedClass);
    }
    
    // Filter by section if provided
    if (section) {
        query += ' AND assigned_section = ?';
        params.push(section);
    }
    
    connection.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching students:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        // Normalize paths in the results
        const normalizedResults = results.map(student => ({
            ...student,
            student_photo: student.student_photo ? 
                path.basename(student.student_photo.replace(/\\/g, '/')) : null,
            birth_certificate: student.birth_certificate ? 
                path.basename(student.birth_certificate.replace(/\\/g, '/')) : null
        }));

        res.json(normalizedResults);
    });
});

// Update the PUT endpoint for student updates
app.put('/students/:id', upload, (req, res) => {
    const studentId = req.params.id;
    
    // Validate required fields
    if (!req.body.student_name || !req.body.registration_number) {
        return res.status(400).json({
            success: false,
            message: 'Student name and registration number are required'
        });
    }

    const {
        student_name,
        registration_number,
        date_of_birth,
        gender,
        country,
        address,
        assigned_class,
        assigned_section,
        father_name,
        mother_name,
        email,
        phone,
        username,
        password
    } = req.body;

    // Get file paths if new files were uploaded
    const studentPhoto = req.files?.['student_photo']?.[0]?.path;
    const birthCertificate = req.files?.['birth_certificate']?.[0]?.path;

    // Build the SQL query dynamically based on what fields are being updated
    let updateFields = [
        'student_name = ?',
        'registration_number = ?',
        'gender = ?',
        'country = ?',
        'address = ?',
        'assigned_class = ?',
        'assigned_section = ?',
        'father_name = ?',
        'mother_name = ?',
        'email = ?',
        'phone = ?',
        'username = ?',
        'password = ?'
    ];
    
    let values = [
        student_name,
        registration_number,
        gender,
        country,
        address,
        assigned_class,
        assigned_section,
        father_name,
        mother_name,
        email,
        phone,
        username,
        password
    ];

    // Handle date_of_birth separately to avoid invalid date issues
    if (date_of_birth && date_of_birth !== 'null' && date_of_birth !== 'undefined') {
        updateFields.push('date_of_birth = ?');
        values.push(date_of_birth);
    }

    // Add file fields if new files were uploaded
    if (studentPhoto) {
        updateFields.push('student_photo = ?');
        values.push(studentPhoto);
    }
    if (birthCertificate) {
        updateFields.push('birth_certificate = ?');
        values.push(birthCertificate);
    }

    // Add the WHERE clause parameter
    values.push(studentId);

    const sql = `UPDATE students SET ${updateFields.join(', ')} WHERE id = ?`;

    connection.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating student:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to update student',
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Get the updated student data to return
        connection.query('SELECT * FROM students WHERE id = ?', [studentId], (err, students) => {
            if (err) {
                console.error('Error fetching updated student:', err);
                return res.json({
                    success: true,
                    message: 'Student updated successfully',
                    // No student data due to error
                });
            }

            res.json({
                success: true,
                message: 'Student updated successfully',
                student: students[0] || null
            });
        });
    });
});

// Get a single student by ID
app.get('/students/:id', (req, res) => {
    const studentId = req.params.id;
    
    const query = 'SELECT * FROM students WHERE id = ?';
    connection.query(query, [studentId], (err, results) => {
        if (err) {
            console.error('Error fetching student:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch student data',
                error: err.message
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Return a consistent response format with success and student properties
        res.json({
            success: true,
            student: results[0]
        });
    });
});

// Update attendance endpoint to include admin tracking
app.post('/attendance', (req, res) => {
    const { attendanceData, admin_id } = req.body;
    
    // Validate attendance data
    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid attendance data' });
    }

    // Create values for bulk insert with admin_id
    const values = attendanceData.map(record => [
        record.date,
        record.class,
        record.section,
        record.student_id,
        record.is_present,
        admin_id // Add admin_id to each attendance record
    ]);

    const sql = `INSERT INTO attendance (date, class, section, student_id, is_present, marked_by) VALUES ?`;

    connection.query(sql, [values], (err, results) => {
        if (err) {
            console.error('Error marking attendance:', err);
            return res.status(500).json({ success: false, message: 'Error marking attendance' });
        }
        res.json({ success: true, message: 'Attendance marked successfully' });
    });
});

// Get attendance by date, class and section
app.get('/attendance', (req, res) => {
    const { date, class: assignedClass, section } = req.query;
    
    const query = `
        SELECT a.*, s.student_name, s.registration_number 
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE s.assigned_class = ? 
        AND s.assigned_section = ?
        AND a.date = ?
    `;
    
    connection.query(query, [assignedClass, section, date], (err, results) => {
        if (err) {
            console.error('Error fetching attendance:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})