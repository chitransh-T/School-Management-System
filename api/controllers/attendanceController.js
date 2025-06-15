import { 
  recordStudentAttendance,
  recordTeacherAttendance,
  getStudentAttendanceByClassIdAndDate,
  getClassIdByNameAndSection,
  getTeacherAttendanceByDate 
} from '../models/attendanceModel.js';

// Save attendance for students and teachers
export const saveAttendance = async (req, res) => {
  const { date, students, teachers } = req.body;

  if ((!students || students.length === 0) && (!teachers || teachers.length === 0)) {
    return res.status(200).json({ message: 'No attendance records to save' });
  }

  try {
    const attendancePromises = [];

    if (students && students.length > 0) {
      attendancePromises.push(Promise.all(students.map((student) =>
        recordStudentAttendance({
          student_id: student.student_id,
          date: date,
          is_present: student.is_present,
          class_id: student.class_id
        })
      )));
    }

    if (teachers && teachers.length > 0) {
      attendancePromises.push(Promise.all(teachers.map((teacher) =>
        recordTeacherAttendance({
          teacher_id: teacher.teacher_id,
          date: date,
          is_present: teacher.is_present
        })
      )));
    }

    const results = await Promise.all(attendancePromises);
    res.status(200).json({ message: 'Attendance recorded successfully', data: results });
  } catch (err) {
    console.error('Error saving attendance:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get attendance report by class & section & date
export const getAttendanceReportBySection = async (req, res) => {
  try {
    const className = decodeURIComponent(req.params.class);
    const section = decodeURIComponent(req.params.section);
    const date = req.params.date;
    const signup_id = req.signup_id;

    const classId = await getClassIdByNameAndSection(className, section, signup_id);
    if (!classId) {
      return res.status(404).json({
        message: `Class not found for ${className} - ${section}`
      });
    }

    const attendance = await getStudentAttendanceByClassIdAndDate(classId, date,signup_id);
    
    if (!attendance) {
      return res.status(200).json({
        message: `No attendance found for ${className} - ${section} on ${date}`,
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

    res.status(200).json({
      teachers: teacherResults || [],
      summary: {
        totalTeachers: teacherResults ? teacherResults.length : 0,
        presentTeachers: teacherResults ? teacherResults.filter(t => t.is_present).length : 0,
        absentTeachers: teacherResults ? teacherResults.filter(t => !t.is_present).length : 0
      }
    });
  } catch (error) {
    console.error('Error fetching teacher attendance:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};