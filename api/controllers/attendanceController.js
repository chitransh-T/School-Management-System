;

import { 
  recordStudentAttendance,
  recordTeacherAttendance,
  getStudentAttendanceByClassIdAndDate,
  getClassIdByNameAndSection,
  getTeacherAttendanceByDate ,
  getStudentAttendanceBySignupIdAndDate,
  getStudentAttendanceBySignupIdAndMonth
} from '../models/attendanceModel.js';

export const saveAttendance = async (req, res) => {
  const { date, students, teachers } = req.body;

  if ((!students || students.length === 0) && (!teachers || teachers.length === 0)) {
    return res.status(200).json({ message: 'No attendance records to save' });
  }

  try {
    const attendanceResults = {
      students: [],
      teachers: [],
      studentErrors: [],
      teacherErrors: []
    };

    if (students && students.length > 0) {
      for (const student of students) {
        try {
          const record = await recordStudentAttendance({
            student_id: student.student_id,
            date,
            is_present: student.is_present,
            class_id: student.class_id
          });
          attendanceResults.students.push(record);
        } catch (err) {
          if (err.code === 'STUDENT_ATTENDANCE_EXISTS') {
            attendanceResults.studentErrors.push({
              student_id: student.student_id,
              message: err.message
            });
          } else {
            throw err;
          }
        }
      }
    }

    if (teachers && teachers.length > 0) {
      for (const teacher of teachers) {
        try {
          const record = await recordTeacherAttendance({
            teacher_id: teacher.teacher_id,
            date,
            is_present: teacher.is_present
          });
          attendanceResults.teachers.push(record);
        } catch (err) {
          if (err.code === 'TEACHER_ATTENDANCE_EXISTS' || err.code === 'ATTENDANCE_EXISTS') {
            attendanceResults.teacherErrors.push({
              teacher_id: teacher.teacher_id,
              message: err.message
            });
          } else {
            throw err;
          }
        }
      }
    }

    // If any attendance exists errors occurred, return 409 with details
    if (attendanceResults.studentErrors.length > 0 || attendanceResults.teacherErrors.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Attendance records already exist of this Date.',
        data: attendanceResults
      });
    }

    // Otherwise, success 200
    res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: attendanceResults
    });

  } catch (err) {
    console.error('Error saving attendance:', err);
    res.status(500).json({ error: err.message });
  }
};

// // ✅ Get attendance report by class & section & date
export const getAttendanceReportBySection = async (req, res) => {
  try {
    const classId = parseInt(req.params.class); // Directly treat as classId
    const section = decodeURIComponent(req.params.section);
    const date = req.params.date;
    const signup_id = req.signup_id;

    const attendance = await getStudentAttendanceByClassIdAndDate(classId, date, signup_id);

    if (!attendance || attendance.length === 0) {
      return res.status(200).json({
        message: `No attendance found for classId ${classId} - ${section} on ${date}`,
        students: []
      });
    }

    res.status(200).json({
      students: attendance
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};


// ✅ Get only teacher attendance
export const getTeacherAttendanceOnly = async (req, res) => {
  const { date } = req.params;
  const signup_id = req.signup_id;

  if (!date) {
    return res.status(400).json({ message: 'Date is required' });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({
      message: 'Invalid date format. Please use YYYY-MM-DD format'
    });
  }

  try {
    const teacherResults = await getTeacherAttendanceByDate(date, signup_id);

    if (!teacherResults) {
      return res.status(200).json({
        message: `No attendance records found for teachers on ${date}`,
        teachers: [],
        summary: {
          totalTeachers: 0,
          presentTeachers: 0,
          absentTeachers: 0
        }
      });
    }

    res.status(200).json({
      teachers: teacherResults,
      summary: {
        totalTeachers: teacherResults.length,
        presentTeachers: teacherResults.filter(t => t.is_present).length,
        absentTeachers: teacherResults.filter(t => !t.is_present).length
      }
    });
  } catch (error) {
    console.error('Error fetching teacher attendance:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

//------


// 📆 GET attendance by specific date
export const getStudentAttendanceForParentByDate = async (req, res) => {
  try {
    const signup_id = req.signup_id;
    const { date } = req.params;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid or missing date format (YYYY-MM-DD required)' });
    }

    const attendance = await getStudentAttendanceBySignupIdAndDate(signup_id, date);
    res.status(200).json({ attendance });
  } catch (err) {
    console.error('Error fetching datewise attendance:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 📅 GET attendance by month (e.g., "2025-07-01")
export const getStudentAttendanceForParentByMonth = async (req, res) => {
  try {
    const signup_id = req.signup_id;
    const { month } = req.params;

    if (!month || !/^\d{4}-\d{2}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Invalid or missing month format (YYYY-MM-01 required)' });
    }

    const attendance = await getStudentAttendanceBySignupIdAndMonth(signup_id, month);
    res.status(200).json({ attendance });
  } catch (err) {
    console.error('Error fetching monthly attendance:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
