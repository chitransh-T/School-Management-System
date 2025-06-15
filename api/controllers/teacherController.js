
import path from 'path';
import fs from 'fs';
import {
  createTeacher,
  // getTeachersBySignupId,
  getTeachersBySchoolId,
  updateTeacher,
  getTeacherById,
  deleteTeacher,
  getTeacherCount
} from '../models/teacherModel.js';
import { createUserPG } from "../models/userModel.js";
import { deleteAttendanceByTeacherId } from '../models/attendanceModel.js';
import { uploadDir } from '../middlewares/upload.js';

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
      password, // Optional: can be auto-generated
    } = req.body;

    const teacherPhotoPath = req.files?.teacher_photo?.[0]?.path || null;
    const qualificationCertificatePath = req.files?.qualification_certificate?.[0]?.path || null;
    const school_id = req.school_id;
    console.log('Registering teacher with school_id:', school_id);
    // 👉 Step 1: Create Signup Entry
    const signup = await createUserPG({ email, password,phone, role: "teacher" ,school_id});
    const signup_id = signup.id;
    

    // 👉 Step 2: Create Teacher Entry
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
      signup_id
    });

    res.status(200).json({ success: true, teacher });

  } catch (err) {
    console.error("Error registering teacher:", err);
    res.status(500).json({ success: false, message: "Error registering teacher" });
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



export const updateTeacherDetails = async (req, res) => {
  const teacherId = req.params.id;
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
    // phone,
    qualification_certificate
  } = req.body;

  let teacherPhoto = req.body.teacher_photo;
  if (req.files?.['teacher_photo']) {
    teacherPhoto = path.basename(req.files['teacher_photo'][0].path);
  }

  try {
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
      // phone,
      qualification_certificate,
      teacher_photo: teacherPhoto
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
    await deleteAttendanceByTeacherId(teacherId);

    const teacherResult = await getTeacherById(teacherId);
    if (!teacherResult) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    const teacherPhoto = teacherResult.teacher_photo;

    await deleteTeacher(teacherId);

    if (teacherPhoto) {
      const photoPath = path.join(uploadDir, teacherPhoto);
      fs.unlink(photoPath, (err) => {
        if (err) console.error('Error deleting photo file:', err);
      });
    }

    res.status(200).json({ message: 'Teacher deleted successfully' });

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