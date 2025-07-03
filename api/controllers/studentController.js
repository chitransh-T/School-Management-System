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
  findSignupByEmail, 
  linkParentStudent,
  getStudentsByTeacherClass,
  getStudentsByParentId,
} from '../models/studentModel.js';
import { createUserPG } from "../models/userModel.js";
import { deleteAttendanceByStudentId } from '../models/attendanceModel.js';
import { uploadDir } from '../middlewares/upload.js';
import { getActiveSessionFromDB } from '../models/sessionModel.js';

import pool from '../config/db.js';

const generateStudentEmail = (studentName, registrationNumber) => {
  const usernamePart = studentName.toLowerCase().replace(/\s+/g, '').substring(0, 5);
  const email = `${usernamePart}${registrationNumber.slice(-4)}@school.edu`;
  // Generate password using first name (before first space) + last 4 digits of registration number
  const firstName = studentName.split(' ')[0].toLowerCase();
  const password = `${firstName}${registrationNumber.slice(-4)}`;
  return { email, password };
};

// Removed generatePassword function as it's no longer needed

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
    // Get student credentials to use same password for parent
    const { email: studentEmail, password: sharedPassword } = generateStudentEmail(student_name, registration_number);

    if (!parentSignup) {
      parentSignup = await createUserPG({
        email: parent_email,
        password: sharedPassword, // Use same password as student
        role: 'parents',
        school_id
      });
    }

    // 2. Create student signup
    const studentSignup = await createUserPG({
      email: studentEmail,
      password: sharedPassword, // Use same password as parent
      role: 'student',
      school_id
    });

    // 3. Insert student record
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

    // 4. Link student to parent
    await linkParentStudent(parentSignup.id, studentRecord.id);

    // 5. Respond
    res.status(201).json({
      success: true,
      message: 'Student and Parent registered successfully',
      data: {
        student: {
          email: studentEmail,
          password: sharedPassword,
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
    const signup_id = req.signup_id;

    // ✅ Fetch active session again
    const activeSession = await getActiveSessionFromDB(signup_id);
    if (!activeSession) {
      return res.status(400).json({ message: 'No active session found' });
    }

    updates.session_id = activeSession.id;

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
    const studentId = parseInt(req.params.id); // ✅ Ensure number

    // Step 1: Delete attendance records
    await deleteAttendanceByStudentId(studentId);

    // Step 2: Get student details
    const student = await getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const signupId = student.signup_id;

    // Step 3: Get associated parent signup ID (if any)
    const result = await pool.query(
      'SELECT parent_signup_id FROM parent_student_link WHERE student_id = $1',
      [studentId]
    );
    const parentSignupId = result.rows[0]?.parent_signup_id;

    // Step 4: Delete parent-student link
    await pool.query('DELETE FROM parent_student_link WHERE student_id = $1', [studentId]);

    // Step 5: Delete student record
    await deleteStudent(studentId);

    // Step 6: Delete student login from signup
    if (signupId) {
      await pool.query('DELETE FROM signup WHERE id = $1', [signupId]);
    }

    // Step 7: Delete parent login from signup (if not used by another student)
    if (parentSignupId) {
      const res2 = await pool.query(
        'SELECT COUNT(*) FROM parent_student_link WHERE parent_signup_id = $1',
        [parentSignupId]
      );
      const count = parseInt(res2.rows[0].count);

      if (count === 0) {
        await pool.query('DELETE FROM signup WHERE id = $1', [parentSignupId]);
      }
    }

    // Step 8: Delete photo if exists
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

export const ggetStudentsByTeacherClass = async (req, res) => {
  try {
    const signup_id = req.signup_id;
    const results = await getStudentsByTeacherClass(signup_id);
    
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




export const getStudentsForParent = async (req, res) => {
  try {
    const parentSignupId = req.signup_id; // From auth middleware
    console.log('👨‍👩‍👧 Parent Signup ID from token:', parentSignupId);

    const students = await getStudentsByParentId(parentSignupId);
    console.log('🎓 Students fetched from DB:', students);

    if (!students || students.length === 0) {
      console.log('⚠ No students linked with this parentSignupId:', parentSignupId);
    }

    const normalizedStudents = students.map(student => ({
      ...student,
      student_photo: student.student_photo
        ? path.basename(student.student_photo.replace(/\\/g, '/'))
        : null,
      birth_certificate: student.birth_certificate
        ? path.basename(student.birth_certificate.replace(/\\/g, '/'))
        : null
    }));

    console.log('🧼 Normalized student data:', normalizedStudents);

    res.status(200).json({
      success: true,
      data: normalizedStudents
    });
  } catch (error) {
    console.error('❌ Error fetching student data for parent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student data',
      error: error.message
    });
  }
};