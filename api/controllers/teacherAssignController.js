import { 
  assignTeacher, 
  getTeacherAssignments, 
  getTeachersByClass,
  updateTeacherAssignmentById,
  deleteTeacherAssignmentById,
  getTeacherAssignmentDetailsById
} from '../models/teacherAssignModel.js';

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

// New controller functions for edit and delete
export const getTeacherAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.school_id;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID is required'
      });
    }

    const assignment = await getTeacherAssignmentDetailsById(id, school_id);
    
    if (!assignment || assignment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (err) {
    console.error('Error fetching teacher assignment:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher assignment',
      error: err.message
    });
  }
};

export const updateTeacherAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_id, subjects } = req.body;
    const school_id = req.school_id;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID is required'
      });
    }

    if (!teacher_id || !subjects || !Array.isArray(subjects)) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID and subjects are required'
      });
    }

    const result = await updateTeacherAssignmentById(id, {
      teacher_id,
      subjects
    }, school_id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found or not authorized'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: result
    });
  } catch (err) {
    console.error('Error updating teacher assignment:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update teacher assignment',
      error: err.message
    });
  }
};

export const deleteTeacherAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.school_id;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID is required'
      });
    }

    const result = await deleteTeacherAssignmentById(id, school_id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found or not authorized'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting teacher assignment:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete teacher assignment',
      error: err.message
    });
  }
};