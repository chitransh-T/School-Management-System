import path from 'path';
import fs from 'fs';
import { 
  createStudent, 
  getStudentsByUser, 
  updateStudent, 
  getStudentById, 
  deleteStudent, 
  getStudentsByClassInSchool, 
  getStudentCount, 
  getStudentCountByClass, 
  getLastRegistrationNumber,
  findSignupByEmail, linkParentStudent 
} from '../models/studentModel.js';
import { createUserPG } from "../models/userModel.js";
import { deleteAttendanceByStudentId } from '../models/attendanceModel.js';
import { uploadDir } from '../middlewares/upload.js';
import { getActiveSessionFromDB } from '../models/sessionModel.js';



const generateStudentEmail = (studentName, registrationNumber) => {
  const usernamePart = studentName.toLowerCase().replace(/\s+/g, '').substring(0, 5);
  const email = `${usernamePart}${registrationNumber.slice(-4)}@school.edu`;
  const password = Math.random().toString(36).slice(-8);
  return { email, password };
};

const generatePassword = () => Math.random().toString(36).slice(-8);



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
      assigned_class,
      assigned_section,
      email: parent_email,
    } = req.body;

    const school_id = req.school_id;
    const signup_id = req.signup_id;

    // ✅ Get active session
    const activeSession = await getActiveSessionFromDB(signup_id);
    if (!activeSession) {
      return res.status(400).json({ message: 'No active session found for this school' });
    }
    const session_id = activeSession.id;

    // 1. Parent signup check or create
    let parentSignup = await findSignupByEmail(parent_email);

    if (!parentSignup) {
      const parentPassword = generatePassword();
      parentSignup = await createUserPG({
        email: parent_email,
        password: parentPassword,
        role: 'parents',
        school_id
      });
    }

    // 2. Generate student credentials
    const { email: studentEmail, password: studentPassword } = generateStudentEmail(student_name, registration_number);

    // 3. Create student signup
    const studentSignup = await createUserPG({
      email: studentEmail,
      password: studentPassword,
      role: 'student',
      school_id
    });

    // 4. Insert student record
    const studentRecord = await createStudent({
      student_name,
      registration_number,
      date_of_birth,
      gender,
      address,
      father_name,
      mother_name,
      assigned_class,
      assigned_section,
      birthCertificatePath: req.files?.['birth_certificate']?.[0]?.filename || null,
      studentPhotoPath: req.files?.['student_photo']?.[0]?.filename || null,
      username: studentEmail,
      signup_id: studentSignup.id,
      session_id   // ✅ include this in student table
    });

    // 5. Link student to parent
    await linkParentStudent(parentSignup.id, studentRecord.id);

    // 6. Respond
    res.status(201).json({
      success: true,
      message: 'Student and Parent registered successfully',
      data: {
        student: {
          email: studentEmail,
          password: studentPassword,
          id: studentRecord.id,
        },
        parent: {
          email: parent_email,
          id: parentSignup.id,
        }
      }
    });
  } catch (error) {
    console.error('Error in registerStudent:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const signup_id = req.signup_id;
    const results = await getStudentsByUser(signup_id);

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
    const deletedStudent = await deleteStudent(studentId);
    if (!deletedStudent) {
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
    const signup_id = req.signup_id;

    const results = await getStudentsByClassInSchool(className, signup_id);
    res.json(results);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const getTotalStudentCount = async (req, res) => {
  try {
    const signup_id = req.signup_id;
    const result = await getStudentCount(signup_id);

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
    const signup_id = req.signup_id;
    const results = await getStudentCountByClass(signup_id);
    
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
    const signup_id = req.signup_id;
    if (!signup_id) {
      return res.status(400).json({
        success: false,
        message: 'User email is missing'
      });
    }

    const lastRegNumber = await getLastRegistrationNumber(signup_id);
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