

import path from 'path';
import fs from 'fs';
import { 
  createTeacher, 
  getTeachersByUser, 
  updateTeacher, 
  getTeacherById, 
  deleteTeacher, 
  getTeacherCount 
} from '../models/teacherModel.js';
import { deleteAttendanceByTeacherId } from '../models/attendanceModel.js';
import { uploadDir } from '../middlewares/upload.js';

export const registerTeacher = async (req, res) => {
  console.log('Uploaded files:', req.files);

  const { 
    teacher_name, email, date_of_birth, date_of_joining, 
    gender, guardian_name, qualification, experience, 
    salary, address, phone 
  } = req.body;
  
  const user_email = req.user_email; // from token

  let teacherPhotoPath = null;
  let qualificationCertificatePath = null;

  try {
    if (req.files && req.files['teacher_photo']) {
      teacherPhotoPath = path.basename(req.files['teacher_photo'][0].path);
    }

    if (req.files && req.files['qualification_certificate']) {
      qualificationCertificatePath = path.basename(req.files['qualification_certificate'][0].path);
    }

    await createTeacher({
      teacher_name,
      email,
      date_of_birth,
      date_of_joining,
      gender,
      guardian_name,
      qualification,
      experience,
      salary,
      address,
      phone,
      qualification_certificate: qualificationCertificatePath,
      teacher_photo: teacherPhotoPath,
      user_email
    });

    res.status(200).json({ message: 'Teacher registered successfully' });

  } catch (err) {
    console.error('Error registering teacher:', err);
    res.status(500).json({ message: 'Error registering teacher', error: err.message });
  }
};

export const getAllTeachers = async (req, res) => {
  const user_email = req.user_email;

  try {
    const teachers = await getTeachersByUser(user_email);

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
    email,
    date_of_birth,
    date_of_joining,
    gender,
    guardian_name,
    qualification,
    experience,
    salary,
    address,
    phone,
    qualification_certificate
  } = req.body;

  let teacherPhoto = req.body.teacher_photo;
  if (req.files && req.files['teacher_photo']) {
    teacherPhoto = path.basename(req.files['teacher_photo'][0].path);
  }

  try {
    await updateTeacher(teacherId, {
      teacher_name,
      email,
      date_of_birth,
      date_of_joining,
      gender,
      guardian_name,
      qualification,
      experience,
      salary,
      address,
      phone,
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

  console.log('Attempting to delete teacher with ID:', teacherId);

  try {
    await deleteAttendanceByTeacherId(teacherId);

    const teacherResult = await getTeacherById(teacherId);
    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    const teacherPhoto = teacherResult.rows[0].teacher_photo;

    await deleteTeacher(teacherId);

    if (teacherPhoto) {
      const photoPath = path.join(uploadDir, teacherPhoto);
      fs.unlink(photoPath, (err) => {
        if (err) {
          console.error('Error deleting photo file:', err);
          // Don't return error response, as teacher already deleted
        }
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
      const user_email = req.user_email;
    const result = await getTeacherCount(user_email);
    if (!result || result.length === 0 || !result[0].totalteachers) {
      return res.status(404).json({
        success: false,
        message: 'Teacher count not found',
        data: result
      });
    }
      res.status(200).json({
      success: true,
      totalTeachers: parseInt(result[0].totalteachers, 10)
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


// export const getTotalStudentCount = async (req, res) => {
//   try {
//     const user_email = req.user_email;
//     const result = await getStudentCount(user_email);

//     // Safe check for result structure
    // if (!result || result.length === 0 || !result[0].totalstudents) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Student count not found',
    //     data: result
    //   });
    // }

//     res.status(200).json({
//       success: true,
//       totalStudents: parseInt(result[0].totalstudents, 10)
//     });
//   } catch (err) {
//     console.error('Error fetching student count:', err);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch student count',
//       error: err.message
//     });
//   }
// };

