import { assignTeacher, getTeacherAssignments, getTeachersByClass } from '../models/teacherAssignModel.js';

export const assignTeacherToClass = async (req, res) => {
  try {
    const { teacher_id, class_id, section, subject_ids } = req.body;
    
    if (!teacher_id || !class_id || !section || !subject_ids || !Array.isArray(subject_ids)) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID, Class ID, Section, and Subject IDs are required'
      });
    }

    const result = await assignTeacher({
      teacher_id,
      class_id,
      section,
      subject_ids
    });

    res.status(201).json({
      success: true,
      message: 'Teacher assigned successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error assigning teacher:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to assign teacher',
      error: err.message
    });
  }
};
export const getAllTeacherAssignments = async (req, res) => {
  try {
    const school_id = req.school_id; // 👈 assume JWT token se aa raha hai

    const assignments = await getTeacherAssignments(school_id);

    res.status(200).json({
      success: true,
      data: assignments
    });
  } catch (err) {
    console.error('Error fetching teacher assignments:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher assignments',
      error: err.message
    });
  }
};

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