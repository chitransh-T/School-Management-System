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
// app.get('/login', (req,res)=>{
//     res.send("Welcome to login page")
// })
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'select * from signup where email = ? and password = ?';
    // const user = users.find((user)=> user.email === email && user.password === password);
    connection.query(query, [email, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
        if (results.length > 0) {
            return res.json({ success: true, message: 'Login successful' });
        }
        else {
            return res.status(400).json({ success: false, message: 'Invalid Credentials' });
        }
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
        password
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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
        birthCertificate,  // Path to the birth certificate file
        studentPhoto,      // Path to the student photo file
        username,
        password,
    ], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error registering student' });
        }
        res.status(200).json({ success: true, message: 'Student registered successfully' });
    });
});

app.get('/students', (req, res) => {
    const query = 'SELECT * FROM students';
    connection.query(query, (err, results) => {
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


// API to update student details
app.put('/students/:id', upload, (req, res) => {
    const studentId = req.params.id;
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
      birth_certificate,
    } = req.body;

    // Handle photo upload
    let studentPhoto = req.body.student_photo; // Keep existing photo if not updated
    if (req.files && req.files['student_photo']) {
      studentPhoto = path.basename(req.files['student_photo'][0].path);
    }
  
    const updateQuery = `
      UPDATE students SET
        student_name = ?, 
        registration_number = ?, 
        date_of_birth = ?, 
        gender = ?, 
        country = ?,
        address = ?, 
        assigned_class = ?, 
        assigned_section = ?, 
        father_name = ?, 
        mother_name = ?, 
        email = ?, 
        phone = ?, 
        birth_certificate = ?, 
        student_photo = ?
      WHERE id = ?
    `;
  
    connection.query(updateQuery, [
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
      studentPhoto,
      studentId,
    ], (err, results) => {
      if (err) {
        console.error('Error updating student:', err);
        return res.status(500).json({ error: 'Failed to update student' });
      }
      res.status(200).json({ message: 'Student updated successfully' });
    });
  });




app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})