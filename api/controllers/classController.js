

import pool from '../config/db.js';
import { createClass, getClassesBySchoolId, updateClass, deleteClass , getClassByTeacherId,getClassCountBySchoolId } from '../models/classModel.js';




//---
export const registerClass = async (req, res) => {
  try {
    const { class_name, section, teacher_id } = req.body;
    const signup_id = req.signup_id;

    if (!class_name || !section || !teacher_id || !signup_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // ✅ Check if the teacher is already assigned to any class
    const existingClass = await getClassByTeacherId(teacher_id);

    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'This teacher is already assigned as a class teacher. Please select another teacher.',
      });
    }

    // ✅ Proceed with class creation
    const result = await createClass({ class_name, section, teacher_id, signup_id });

    res.status(201).json({
      success: true,
      message: 'Class registered successfully',
      classId: result.id,
    });
  } catch (err) {
    console.error('Error registering class:', err);
    res.status(500).json({ message: 'Error registering class' });
  }
};

export const getAllClasses = async (req, res) => {
  try {
    const signup_id = req.signup_id;

    if (!signup_id) {
      return res.status(400).json({ message: 'Signup ID is required' });
    }

    const results = await getClassesBySchoolId(signup_id);  // school id ke hisaab se classes fetch ho rahe hain
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching classes:', err);
    res.status(500).json({ message: 'Error fetching classes' });
  }
};


export const updateClassDetails = async (req, res) => {
  try {
    const classId = req.params.id;
    const { class_name, teacher_id } = req.body;

    if (!classId || !class_name || !teacher_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // ✅ Check if the teacher is already assigned to a different class
    const existingClass = await getClassByTeacherId(teacher_id);
    if (existingClass && existingClass.id !== classId) {
      return res.status(400).json({
        success: false,
        message:
          'This teacher is already assigned as a class teacher. Please select another teacher.',
      });
    }

    const results = await updateClass(classId, { class_name, teacher_id });

    if (results.rowCount === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Class updated successfully',
    });
  } catch (err) {
    console.error('Error updating class:', err);
    res.status(500).json({ message: 'Error updating class' });
  }
};

// Delete class
export const deleteClassById = async (req, res) => {
  try {
    const classId = req.params.id;

    if (!classId) {
      return res.status(400).json({ message: 'Class ID is required' });
    }

    const results = await deleteClass(classId);
    
    if (results.rowCount === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting class:', err);
    res.status(500).json({ message: 'Error deleting class' });
  }
};

export const getAssignedClass = async (req, res) => {
  try {
    const signup_id = req.signup_id; // From auth middleware

    if (!signup_id) {
      return res.status(400).json({ message: 'Signup ID is required' });
    }

    // Fetch the teacher's ID from the teacher table using signup_id
    const teacherQuery = 'SELECT id FROM teacher WHERE signup_id = $1';
    const teacherResult = await pool.query(teacherQuery, [signup_id]);

    if (!teacherResult.rows.length) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const teacher_id = teacherResult.rows[0].id;

    // Fetch the assigned class
    const classResult = await getClassByTeacherId(teacher_id);

    if (!classResult) {
      return res.status(404).json({ message: 'No class assigned to this teacher' });
    }

    res.status(200).json(classResult);
  } catch (err) {
    console.error('Error fetching assigned class:', err);
    res.status(500).json({ message: 'Error fetching assigned class' });
  }
};
// Add this to your classController.js
export const getClassCount = async (req, res) => {
  try {
    const signup_id = req.signup_id;

    if (!signup_id) {
      return res.status(400).json({ message: 'Signup ID is required' });
    }

    const count = await getClassCountBySchoolId(signup_id);
    res.status(200).json({ totalClasses: count });
  } catch (err) {
    console.error('Error fetching class count:', err);
    res.status(500).json({ message: 'Error fetching class count' });
  }
};