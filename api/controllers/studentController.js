

import path from 'path';
import fs from 'fs';
import { 
  createStudent, 
  getStudentsByUser, 
  updateStudent, 
  getStudentById, 
  deleteStudent, 
  getStudentsByClass, 
  getStudentCount, 
  getStudentCountByClass, 
  getLastRegistrationNumber 
} from '../models/studentModel.js';
import { deleteAttendanceByStudentId } from '../models/attendanceModel.js';
import { uploadDir } from '../middlewares/upload.js';

const generateCredentials = (studentName, registrationNumber) => {
  const username = `${studentName.toLowerCase().replace(/\s+/g, '').substring(0, 5)}${registrationNumber.slice(-4)}`;
  const email = `${username}@school.edu`;
  const password = Math.random().toString(36).slice(-8);
  return { username, password, email };
};

export const registerStudent = async (req, res) => {
  try {
    const { 
      student_name, 
      registration_number, 
      date_of_birth, 
      gender, 
      address, 
      father_name, 
      mother_name, 
      email, 
      phone, 
      assigned_class, 
      assigned_section,
      username,
      password
    } = req.body;
    
    const user_email = req.user_email;

    let studentPhotoPath = null;
    let birthCertificatePath = null;

    if (req.files?.['student_photo']) {
      studentPhotoPath = req.files['student_photo'][0].filename;
    }

    if (req.files?.['birth_certificate']) {
      birthCertificatePath = req.files['birth_certificate'][0].filename;
    }

    const credentials = (username && password)
      ? { username, password }
      : generateCredentials(student_name, registration_number);

    try {
      const result = await createStudent({
        student_name,
        registration_number,
        date_of_birth,
        gender,
        address: address || null,
        father_name: father_name || null,
        mother_name: mother_name || null,
        email: email || null,
        phone: phone || null,
        assigned_class,
        assigned_section,
        birthCertificatePath,
        studentPhotoPath,
        username: credentials.username,
        password: credentials.password,
        user_email
      });

      res.status(201).json({
        success: true,
        message: 'Student registered successfully',
        data: {
          studentId: result.id,
          credentials: {
            username: req.body.username,
            password: req.body.password
          }
        }
      });
    } catch (err) {
      if (err.code === '23505') { // PostgreSQL unique violation
        const field = err.constraint.includes('registration_number') ? 'Registration number' : 'Username';
        return res.status(409).json({
          success: false,
          message: `${field} already exists`,
          error: err.detail
        });
      }
      throw err;
    }
  } catch (err) {
    console.error('Error registering student:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to register student',
      error: err.message
    });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const user_email = req.user_email;
    const results = await getStudentsByUser(user_email);

    const normalizedResults = results.map(student => ({
      ...student,
      student_photo: student.student_photo ? 
        path.basename(student.student_photo.replace(/\\/g, '/')) : null,
      birth_certificate: student.birth_certificate ? 
        path.basename(student.birth_certificate.replace(/\\/g, '/')) : null
    }));

    res.json(normalizedResults);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateStudentDetails = async (req, res) => {
  try {
    const studentId = req.params.id;
    const updates = req.body;

    if (req.files?.['student_photo']) {
      updates.student_photo = path.basename(req.files['student_photo'][0].path);
    }

    const result = await updateStudent(studentId, updates);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.status(200).json({ message: 'Student updated successfully' });
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ error: 'Failed to update student' });
  }
};

export const deleteStudentById = async (req, res) => {
  try {
    const studentId = req.params.id;

    // Delete attendance records
    await deleteAttendanceByStudentId(studentId);

    // Get student details
    const student = await getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Delete student
    const deleteResult = await deleteStudent(studentId);
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Delete photo file if exists
    if (student.student_photo) {
      const photoPath = path.join(uploadDir, student.student_photo);
      fs.unlink(photoPath, (err) => {
        if (err) console.error('Error deleting photo:', err);
      });
    }

    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
};

export const getStudentsByClassName = async (req, res) => {
  try {
    const className = decodeURIComponent(req.params.class);
    const user_email = req.user_email;

    const results = await getStudentsByClass(className, user_email);
    res.json(results);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTotalStudentCount = async (req, res) => {
  try {
    const user_email = req.user_email;
    const result = await getStudentCount(user_email);

    // Safe check for result structure
    if (!result || result.length === 0 || !result[0].totalstudents) {
      return res.status(404).json({
        success: false,
        message: 'Student count not found',
        data: result
      });
    }

    res.status(200).json({
      success: true,
      totalStudents: parseInt(result[0].totalstudents, 10)
    });
  } catch (err) {
    console.error('Error fetching student count:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student count',
      error: err.message
    });
  }
};


export const modelgetStudentCountByClass = async (req, res) => {
  try {
    const user_email = req.user_email;
    const results = await getStudentCountByClass(user_email);
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      success: false,
      message: 'Database error',
      data: []
    });
  }
};

export const ggetLastRegistrationNumber = async (req, res) => {
  try {
    const user_email = req.user_email;
    if (!user_email) {
      return res.status(400).json({
        success: false,
        message: 'User email is missing'
      });
    }

    const lastRegNumber = await getLastRegistrationNumber(user_email);
    res.status(200).json({
      success: true,
      lastRegistrationNumber: lastRegNumber
    });
  } catch (err) {
    console.error("Controller error:", err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

export const getStudentDashboardDetails = async (req, res) => {
  try {
    const studentId = req.params.id;
    const user_email = req.user_email;

    const student = await getStudentById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.user_email.trim().toLowerCase() !== user_email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to student data'
      });
    }

    const dashboardData = {
      success: true,
      data: {
        id: student.id,
        name: student.student_name,
        class_name: student.assigned_class,
        registration_number: student.registration_number,
        profile_image: student.student_photo 
          ? path.join('/uploads', path.basename(student.student_photo)) 
          : null
      }
    };

    res.status(200).json(dashboardData);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Database error',
      error: err.message 
    });
  }
};