

// controllers/attendanceController.js
import { 
  recordStudentAttendance,
  recordTeacherAttendance,
  getStudentAttendanceByClassAndSectionAndDate,
  getTeacherAttendanceByDate 
} from '../models/attendanceModel.js';

// Helper function to record student attendance
const recordAttendanceForStudents = async (students, date) => {
  const studentPromises = students.map(async (student) => {
    try {
      const results = await recordStudentAttendance({
        student_id: student.student_id,
        date: date,
        is_present: student.is_present,
        class_name: student.class_name
      });
      return results;
    } catch (err) {
      throw new Error(`Error recording student attendance for student ${student.student_id}: ${err.message}`);
    }
  });
  return Promise.all(studentPromises);
};

// Helper function to record teacher attendance
const recordAttendanceForTeachers = async (teachers, date) => {
  const teacherPromises = teachers.map(async (teacher) => {
    try {
      const results = await recordTeacherAttendance({
        teacher_id: teacher.teacher_id,
        date: date,
        is_present: teacher.is_present
      });
      return results;
    } catch (err) {
      throw new Error(`Error recording teacher attendance for teacher ${teacher.teacher_id}: ${err.message}`);
    }
  });
  return Promise.all(teacherPromises);
};

export const saveAttendance = async (req, res) => {
  const { date, students, teachers } = req.body;

  if ((!students || students.length === 0) && (!teachers || teachers.length === 0)) {
    return res.status(200).json({ message: 'No attendance records to save' });
  }

  try {
    const attendancePromises = [];

    if (students && students.length > 0) {
      attendancePromises.push(recordAttendanceForStudents(students, date));
    }

    if (teachers && teachers.length > 0) {
      attendancePromises.push(recordAttendanceForTeachers(teachers, date));
    }

    await Promise.all(attendancePromises);
    res.status(200).json({ message: 'Attendance recorded successfully' });
  } catch (err) {
    console.error('Error saving attendance:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getAttendanceReportBySection = async (req, res) => {
  try {
    const className = decodeURIComponent(req.params.class);
    const section = decodeURIComponent(req.params.section);
    const date = req.params.date;
    const user_email = req.user_email;

    if (!className || !section || !date) {
      return res.status(400).json({
        message: 'Missing required parameters: class, section, and date are required'
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        message: 'Invalid date format. Please use YYYY-MM-DD format'
      });
    }

    try {
      const studentResults = await getStudentAttendanceByClassAndSectionAndDate(className, section, date, user_email);
      
      if (studentResults === null) {
        return res.status(200).json({
          message: `Attendance not marked for Class: ${className}, Section: ${section} on ${date}`,
          students: [],
          teachers: [],
          summary: null
        });
      }

      const teacherResults = await getTeacherAttendanceByDate(date, user_email);
      
      const students = Array.isArray(studentResults) ? studentResults : [];
      const teachers = Array.isArray(teacherResults) ? teacherResults : [];

      res.json({
        students: students,
        teachers: teachers,
        summary: {
          totalStudents: students.length,
          presentStudents: students.filter(s => s.is_present === true).length,
          absentStudents: students.filter(s => s.is_present === false).length,
          totalTeachers: teachers.length,
          presentTeachers: teachers.filter(t => t.is_present === true).length,
          absentTeachers: teachers.filter(t => t.is_present === false).length
        }
      });
    } catch (err) {
      console.error('Error fetching attendance:', err);
      return res.status(500).json({
        message: 'Error fetching attendance data',
        error: err.message
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};


// ✅ Only teacher attendance by date
export const getTeacherAttendanceOnly = async (req, res) => {
  const { date } = req.params;
  const user_email = req.user_email;

  if (!date) {
    return res.status(400).json({ message: 'Date is required' });
  }

  try {
    const teacherResults = await getTeacherAttendanceByDate(date, user_email);

    res.status(200).json({
      teachers: teacherResults,
    });
  } catch (error) {
    console.error('Error fetching teacher attendance:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};