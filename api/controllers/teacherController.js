import path from 'path';
import pool from '../config/db.js';

import fs from 'fs';
import {
  createTeacher,
  getTeachersBySchoolId,
  updateTeacher,
  getTeacherById,
  deleteTeacher,
  getTeacherCount,
  getTeacherBySignupId,
  getTeachersByClass
} from '../models/teacherModel.js';
import { createUserPG } from "../models/userModel.js";
import { deleteAttendanceByTeacherId } from '../models/attendanceModel.js';
import { uploadDir } from '../middlewares/upload.js';
import { getActiveSessionFromDB } from '../models/sessionModel.js';

export const registerTeacher = async (req, res) => {
  try {
    const {
      teacher_name,
      date_of_birth,
      date_of_joining,
      gender,
      guardian_name,
      qualification,
      experience,
      salary,
      address,
      phone,
      email,
      password,
    } = req.body;

    const teacherPhotoPath = req.files?.teacher_photo?.[0]?.path || null;
    const qualificationCertificatePath = req.files?.qualification_certificate?.[0]?.path || null;

    const admin_signup_id = req.signup_id; // from middleware
    const school_id = req.school_id;      // from middleware
    if (!admin_signup_id || !school_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch active session for this school admin signup_id
    const activeSession = await getActiveSessionFromDB(admin_signup_id);
    if (!activeSession) {
      return res.status(400).json({ message: 'No active session found for this school' });
    }

    const session_id = activeSession.id;

    // Create teacher's signup (login) record with backend school_id (not from frontend)
    const teacherSignup = await createUserPG({
      email,
      password,
      role: "teacher",
      school_id,  // backend injected school_id from token
      phone // optional
    });
    const teacher_signup_id = teacherSignup.id;

    // Create teacher profile with signup_id of teacher and session_id
    const teacher = await createTeacher({
      teacher_name,
      date_of_birth,
      date_of_joining,
      gender,
      guardian_name,
      qualification,
      experience,
      salary,
      address,
      qualification_certificate: qualificationCertificatePath,
      teacher_photo: teacherPhotoPath,
      signup_id: teacher_signup_id,  // teacher's own signup id here
      session_id
    });

    return res.status(200).json({
      success: true,
      message: 'Teacher registered successfully',
      teacher,
      login_email: teacherSignup.email
    });

  } catch (err) {
    console.error("Error registering teacher:", err);
    return res.status(500).json({ success: false, message: "Error registering teacher", error: err.message });
  }
};

export const getAllTeachers = async (req, res) => {
  try {
    const signup_id = req.signup_id;  // from auth middleware

    if (!signup_id) {
      return res.status(401).json({ message: 'Unauthorized: signup_id not found' });
    }

    const teachers = await getTeachersBySchoolId(signup_id);

    const normalizedResults = teachers.map(teacher => ({
      ...teacher,
      teacher_photo: teacher.teacher_photo ? path.basename(teacher.teacher_photo.replace(/\\/g, '/')) : null,
      qualification_certificate: teacher.qualification_certificate ? path.basename(teacher.qualification_certificate.replace(/\\/g, '/')) : null
    }));

    res.json(normalizedResults);
  } catch (err) {
    console.error('Error fetching teachers:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const getTeacherDetails = async (req, res) => {
  try {
    const signup_id = req.signup_id;
    if (!signup_id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: signup_id not found' });
    }

    const teacher = await getTeacherBySignupId(signup_id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const normalizedTeacher = {
      ...teacher,
      teacher_photo: teacher.teacher_photo ? path.basename(teacher.teacher_photo.replace(/\\/g, '/')) : null,
      qualification_certificate: teacher.qualification_certificate
        ? path.basename(teacher.qualification_certificate.replace(/\\/g, '/'))
        : null,
      teacher_photo_url: teacher.teacher_photo ? `/uploads/${path.basename(teacher.teacher_photo.replace(/\\/g, '/'))}` : null,
    };

    return res.json({ success: true, data: normalizedTeacher });
  } catch (err) {
    console.error('Error fetching teacher details:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch teacher details', error: err.message });
  }
};
export const updateTeacherDetails = async (req, res) => {
  try {
    const teacherId = req.params.id;

    // Fetch active session for current user/admin (using signup_id from middleware)
    const signup_id = req.signup_id;
    if (!signup_id) {
      return res.status(401).json({ message: 'Unauthorized: signup_id not found' });
    }
    const activeSession = await getActiveSessionFromDB(signup_id);
    if (!activeSession) {
      return res.status(400).json({ message: 'No active session found for this school' });
    }
    const session_id = activeSession.id;

    // Extract fields from body
    const {
      teacher_name,
      date_of_birth,
      date_of_joining,
      gender,
      guardian_name,
      qualification,
      experience,
      salary,
      address,
      qualification_certificate
    } = req.body;

    let teacherPhoto = req.body.teacher_photo;
    if (req.files?.['teacher_photo']) {
      teacherPhoto = path.basename(req.files['teacher_photo'][0].path);
    }

    // Pass session_id to update function
    await updateTeacher(teacherId, {
      teacher_name,
      date_of_birth,
      date_of_joining,
      gender,
      guardian_name,
      qualification,
      experience,
      salary,
      address,
      qualification_certificate,
      teacher_photo: teacherPhoto,
      session_id  // <-- pass it here
    });

    res.status(200).json({ message: 'Teacher updated successfully' });

  } catch (err) {
    console.error('Error updating teacher:', err);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
};

export const deleteTeacherById = async (req, res) => {
  const teacherId = req.params.id;

  try {
    // 1. Check if teacher is assigned to any class
    const checkQuery = 'SELECT * FROM classes WHERE teacher_id = $1';
    const assignedClasses = await pool.query(checkQuery, [teacherId]);

    if (assignedClasses.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete teacher. Please unassign from class first.',
      });
    }

    // 2. Get teacher details
    const teacherResult = await getTeacherById(teacherId);
    if (!teacherResult) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const teacherPhoto = teacherResult.teacher_photo;
    const signupId = teacherResult.signup_id;

    // 3. Delete attendance and teacher
    await deleteAttendanceByTeacherId(teacherId);
    await deleteTeacher(teacherId); // DELETE FROM teachers WHERE id = $1

    // 4. Delete from signup table
    if (signupId) {
      await pool.query('DELETE FROM signup WHERE id = $1', [signupId]);
    }

    // 5. Delete photo if exists
    if (teacherPhoto) {
      const photoPath = path.join(uploadDir, teacherPhoto);
      fs.unlink(photoPath, (err) => {
        if (err) console.error('Error deleting photo file:', err);
      });
    }

    res.status(200).json({ success: true, message: 'Teacher deleted successfully' });

  } catch (err) {
    console.error('Error deleting teacher:', err);
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
};

export const getTotalTeacherCount = async (req, res) => {
  try {
    const signup_id = req.signup_id;
    const result = await getTeacherCount(signup_id);
    const count = result?.[0]?.totalteachers || 0;

    res.status(200).json({
      success: true,
      totalTeachers: parseInt(count, 10)
    });
  } catch (err) {
    console.error('Error fetching Teacher count:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Teacher count',
      error: err.message
    });
  }
};
//---------

export const getClassTeachers = async (req, res) => {
  try {
    const { class_id, section } = req.params;
    
    if (!class_id || !section) {
      return res.status(400).json({
        success: false,
        message: 'Class ID and Section are required'
      });
    }

    const teachers = await getTeachersByClass(class_id, section);
    res.status(200).json({
      success: true,
      data: teachers
    });
  } catch (err) {
    console.error('Error fetching class teachers:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class teachers',
      error: err.message
    });
  }
};