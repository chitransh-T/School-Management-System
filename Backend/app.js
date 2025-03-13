import express from 'express';
import bodyparser from 'body-parser';
import cors from 'cors';
import connection from './database/db_connection.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 1000;

// Configure middleware
app.use(cors());
app.use(bodyparser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Create multer upload instance
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB size limit per file
});

// Create multer upload instance for multiple files
const uploadMultiple = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB size limit per file
}).fields([
    { name: 'student_photo', maxCount: 1 },
    { name: 'birth_certificate', maxCount: 1 }
]);

app.get('/', (req,res) => {
    res.send("Welcome")
})

// Login API
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

// Dashboard endpoint to get admin-specific data
app.get('/dashboard/:userId', (req, res) => {
    const userId = req.params.userId;
    
    if (!userId) {
        return res.status(400).json({ 
            success: false, 
            message: 'User ID is required' 
        });
    }

    // Query to get counts of students, teachers, classes created by this admin
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM students WHERE created_by = ?) as totalStudents,
            (SELECT COUNT(*) FROM teachers WHERE created_by = ?) as totalTeachers,
            (SELECT COUNT(DISTINCT assigned_class) FROM students WHERE created_by = ?) as totalClasses
    `;

    connection.query(query, [userId, userId, userId], (err, results) => {
        if (err) {
            console.error('Error fetching dashboard data:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch dashboard data',
                error: err.message
            });
        }

        // Get notices for this admin
        const noticesQuery = `
            SELECT id, message, DATE_FORMAT(created_at, '%Y-%m-%d') as postedOn 
            FROM notices 
            WHERE created_by = ? 
            ORDER BY created_at DESC 
            LIMIT 5
        `;

        connection.query(noticesQuery, [userId], (noticesErr, notices) => {
            if (noticesErr) {
                console.error('Error fetching notices:', noticesErr);
                // Still return the dashboard data even if notices fail
                return res.json({
                    success: true,
                    data: {
                        ...results[0],
                        notices: []
                    }
                });
            }

            res.json({
                success: true,
                data: {
                    ...results[0],
                    notices: notices
                }
            });
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

// POST API for student registration
app.post('/registerstudent', uploadMultiple, (req, res) => {
    console.log('Received student registration request:', req.body);
    
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

    // Validate required fields
    if (!student_name || !assigned_class || !admin_id) {
        return res.status(400).json({
            success: false,
            message: 'Student name, class, and admin ID are required'
        });
    }

    // Process file uploads
    let studentPhotoPath = null;
    let birthCertificatePath = null;

    if (req.files) {
        if (req.files['student_photo']) {
            studentPhotoPath = req.files['student_photo'][0].path;
        }
        if (req.files['birth_certificate']) {
            birthCertificatePath = req.files['birth_certificate'][0].path;
        }
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

    // Log the file paths being saved
    console.log('Saving student photo:', studentPhotoPath);
    console.log('Saving birth certificate:', birthCertificatePath);

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
        birthCertificatePath,
        studentPhotoPath,
        username,
        password,
        admin_id // Add admin_id to the query parameters
    ], (err, results) => {
        if (err) {
            console.error('Error registering student:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error registering student',
                error: err.message 
            });
        }

        console.log('Student registered successfully');
        res.status(201).json({ 
            success: true, 
            message: 'Student registered successfully',
            data: {
                id: results.insertId,
                student_name,
                assigned_class,
                assigned_section
            }
        });
    });
});

// Update the students endpoint to filter by admin_id
app.get('/students', (req, res) => {
    console.log('Received request for students with query:', req.query);
    const { class: assignedClass, section, admin_id } = req.query;

    let query = 'SELECT * FROM students';
    let params = [];
    let conditions = [];

    // Filter by admin_id (user who created the student)
    if (admin_id) {
        conditions.push('created_by = ?');
        params.push(admin_id);
        console.log('Added admin filter:', admin_id);
    }

    // Add filters if provided
    if (assignedClass) {
        conditions.push('(assigned_class = ? OR assigned_class = CONCAT("class ", ?))');
        params.push(assignedClass, assignedClass);
        console.log('Added class filter:', assignedClass);
    }

    if (section) {
        conditions.push('LOWER(assigned_section) = LOWER(?)');
        params.push(section);
        console.log('Added section filter:', section);
    }

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    console.log('Executing query:', query);
    console.log('With parameters:', params);

    connection.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching students:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Failed to fetch students',
                error: err.message 
            });
        }

        // Normalize file paths in the results
        const normalizedResults = results.map(student => ({
            ...student,
            student_photo: student.student_photo ? 
                path.basename(student.student_photo) : null,
            birth_certificate: student.birth_certificate ? 
                path.basename(student.birth_certificate) : null
        }));

        console.log(`Found ${normalizedResults.length} students`);
        res.json(normalizedResults);
    });
});

app.put('/students/:id', uploadMultiple, (req, res) => {
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
        values.push(path.basename(studentPhoto));
    }
    if (birthCertificate) {
        updateFields.push('birth_certificate = ?');
        values.push(path.basename(birthCertificate));
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

app.delete('/students/:id', (req, res) => {
    const studentId = req.params.id;
    console.log('Delete request received for student ID:', studentId);
    
    // First delete attendance records
    const deleteAttendanceQuery = 'DELETE FROM attendance WHERE student_id = ?';
    connection.query(deleteAttendanceQuery, [studentId], (err) => {
        if (err) {
            console.error('Error deleting attendance records:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Failed to delete attendance records',
                message: err.message 
            });
        }
        
        console.log('Successfully deleted attendance records for student:', studentId);
        
        // Now get student details for file deletion
        const getStudentQuery = 'SELECT student_photo, birth_certificate FROM students WHERE id = ?';
        connection.query(getStudentQuery, [studentId], (err, results) => {
            if (err) {
                console.error('Error fetching student:', err);
                return res.status(500).json({ 
                    success: false,
                    error: 'Failed to fetch student details',
                    message: err.message 
                });
            }
            
            const files = results.length > 0 ? {
                student_photo: results[0].student_photo,
                birth_certificate: results[0].birth_certificate
            } : {};
            
            // Delete the student record
            const deleteStudentQuery = 'DELETE FROM students WHERE id = ?';
            connection.query(deleteStudentQuery, [studentId], (err, deleteResult) => {
                if (err) {
                    console.error('Error deleting student:', err);
                    return res.status(500).json({ 
                        success: false,
                        error: 'Failed to delete student',
                        message: err.message 
                    });
                }

                if (deleteResult.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        error: 'Student not found'
                    });
                }
                
                // Delete associated files
                const filesToDelete = Object.values(files).filter(Boolean);
                let deletedFiles = 0;
                let fileErrors = [];
                
                filesToDelete.forEach(filename => {
                    const filepath = path.join(__dirname, 'uploads', filename);
                    if (fs.existsSync(filepath)) {
                        try {
                            fs.unlinkSync(filepath);
                            deletedFiles++;
                        } catch (error) {
                            fileErrors.push({ file: filename, error: error.message });
                        }
                    }
                });
                
                res.json({ 
                    success: true,
                    message: 'Student deleted successfully',
                    details: {
                        attendanceDeleted: true,
                        studentDeleted: true,
                        filesDeleted: deletedFiles,
                        totalFiles: filesToDelete.length,
                        fileErrors: fileErrors.length > 0 ? fileErrors : undefined
                    }
                });
            });
        });
    });
});

// Mark attendance for multiple students
app.post('/attendance', (req, res) => {
    const { attendanceData } = req.body;

    // Validate request body
    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
        return res.status(400).json({ message: 'Invalid attendance data' });
    }

    // Validate each attendance record
    for (const record of attendanceData) {
        if (!record.date || !record.class || !record.section || !record.student_id || record.is_present === undefined) {
            return res.status(400).json({ message: 'Missing required fields in attendance data' });
        }
    }

    const query = `INSERT INTO attendance (date, class, section, student_id, is_present, marked_by) VALUES ?`;
    const values = attendanceData.map(record => [
        record.date,
        record.class,
        record.section,
        record.student_id,
        record.is_present,
        record.marked_by
    ]);

    connection.query(query, [values], (err, result) => {
        if (err) {
            console.error('Error marking attendance:', err);
            return res.status(500).json({ message: 'Failed to mark attendance' });
        }

        res.json({ 
            message: 'Attendance marked successfully',
            recordsInserted: result.affectedRows 
        });
    });
});

// Get attendance records
app.get('/attendance', (req, res) => {
    const { date, class: assignedClass, section } = req.query;

    // Validate required parameters
    if (!date || !assignedClass || !section) {
        return res.status(400).json({ message: 'Date, class, and section are required' });
    }

    console.log('Fetching attendance with params:', { date, class: assignedClass, section });

    const query = `
        SELECT 
            s.id,
            s.student_name,
            s.registration_number,
            s.assigned_class,
            s.assigned_section,
            a.is_present,
            a.date,
            CASE WHEN a.is_present = 1 THEN 'Present' ELSE 'Absent' END as status
        FROM 
            students s
            LEFT JOIN attendance a ON s.id = a.student_id 
            AND a.date = ? 
            AND a.class = ?
            AND a.section = ?
        WHERE 
            s.assigned_class = ?
            AND s.assigned_section = ?
        ORDER BY 
            s.student_name
    `;

    console.log('Executing query:', query);
    console.log('Query parameters:', [date, assignedClass, section, assignedClass, section]);

    connection.query(
        query,
        [date, assignedClass, section, assignedClass, section],
        (err, results) => {
            if (err) {
                console.error('Error fetching attendance:', err);
                return res.status(500).json({ message: 'Failed to fetch attendance records' });
            }

            console.log('Query results:', results);

            if (results.length === 0) {
                return res.status(404).json({ message: 'No attendance records found' });
            }

            // Format the results
            const formattedResults = results.map(record => ({
                ...record,
                status: record.is_present === null ? 'Not Marked' : record.status
            }));

            res.json(formattedResults);
        }
    );
});

// Create notices table if it doesn't exist
connection.query(`
    CREATE TABLE IF NOT EXISTS notices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message TEXT NOT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES signup(id)
    )
`, (err) => {
    if (err) {
        console.error('Error creating notices table:', err);
    } else {
        console.log('Notices table created or already exists');
    }
});

// Add a sample notice for testing if the table is empty
connection.query('SELECT COUNT(*) as count FROM notices', (err, results) => {
    if (err) {
        console.error('Error checking notices count:', err);
        return;
    }
    
    if (results[0].count === 0) {
        // Get a random admin ID
        connection.query('SELECT id FROM signup LIMIT 1', (err, admins) => {
            if (err || admins.length === 0) {
                console.error('Error getting admin ID:', err);
                return;
            }
            
            const adminId = admins[0].id;
            
            // Insert sample notice
            connection.query(
                'INSERT INTO notices (message, created_by) VALUES (?, ?)',
                ['Welcome to your school management system!', adminId],
                (err) => {
                    if (err) {
                        console.error('Error inserting sample notice:', err);
                    } else {
                        console.log('Sample notice added');
                    }
                }
            );
        });
    }
});

// Add a new notice
app.post('/notices', (req, res) => {
    const { message, admin_id } = req.body;
    
    if (!message || !admin_id) {
        return res.status(400).json({
            success: false,
            message: 'Message and admin ID are required'
        });
    }
    
    const query = 'INSERT INTO notices (message, created_by) VALUES (?, ?)';
    
    connection.query(query, [message, admin_id], (err, result) => {
        if (err) {
            console.error('Error creating notice:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to create notice',
                error: err.message
            });
        }
        
        res.status(201).json({
            success: true,
            message: 'Notice created successfully',
            data: {
                id: result.insertId,
                message,
                created_by: admin_id
            }
        });
    });
});

// Get notices for a specific admin
app.get('/notices/:admin_id', (req, res) => {
    const admin_id = req.params.admin_id;
    
    if (!admin_id) {
        return res.status(400).json({
            success: false,
            message: 'Admin ID is required'
        });
    }
    
    const query = `
        SELECT id, message, DATE_FORMAT(created_at, '%Y-%m-%d') as postedOn 
        FROM notices 
        WHERE created_by = ? 
        ORDER BY created_at DESC
    `;
    
    connection.query(query, [admin_id], (err, results) => {
        if (err) {
            console.error('Error fetching notices:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch notices',
                error: err.message
            });
        }
        
        res.json({
            success: true,
            data: results
        });
    });
});

// Delete a notice
app.delete('/notices/:id', (req, res) => {
    const notice_id = req.params.id;
    const admin_id = req.query.admin_id;
    
    if (!notice_id || !admin_id) {
        return res.status(400).json({
            success: false,
            message: 'Notice ID and Admin ID are required'
        });
    }
    
    // First check if the notice belongs to this admin
    const checkQuery = 'SELECT * FROM notices WHERE id = ? AND created_by = ?';
    
    connection.query(checkQuery, [notice_id, admin_id], (err, results) => {
        if (err) {
            console.error('Error checking notice ownership:', err);
            return res.status(500).json({
                success: false,
                message: 'Server error',
                error: err.message
            });
        }
        
        if (results.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this notice'
            });
        }
        
        // Delete the notice
        const deleteQuery = 'DELETE FROM notices WHERE id = ?';
        
        connection.query(deleteQuery, [notice_id], (err) => {
            if (err) {
                console.error('Error deleting notice:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete notice',
                    error: err.message
                });
            }
            
            res.json({
                success: true,
                message: 'Notice deleted successfully'
            });
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})