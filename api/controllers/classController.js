

import { createClass, getClassesBySchoolId, updateClass, deleteClass } from '../models/classModel.js';

// Register class
export const registerClass = async (req, res) => {
  try {
    const { class_name, section, tuition_fees, teacher_id } = req.body;
    const signup_id = req.signup_id; // ✅ Extract from token/session

    if (!class_name || !section || !tuition_fees || !teacher_id || !signup_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await createClass({ class_name, section, tuition_fees, teacher_id, signup_id });

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

// Update class details
export const updateClassDetails = async (req, res) => {
  try {
    const classId = req.params.id;
    const { class_name, tuition_fees, teacher_id } = req.body;

    if (!classId || !class_name || !tuition_fees || !teacher_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const results = await updateClass(classId, { class_name, tuition_fees, teacher_id });
    
    if (results.rowCount === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Class updated successfully'
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