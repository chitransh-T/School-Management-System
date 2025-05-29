

import { createClass, getClassesByUser, updateClass, deleteClass } from '../models/classModel.js';

// Register class
export const registerClass = async (req, res) => {
  try {
    const { class_name, section, tuition_fees, teacher_name } = req.body;
    const user_email = req.user_email;

    if (!class_name || !section || !tuition_fees || !teacher_name || !user_email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await createClass({ class_name, section, tuition_fees, teacher_name, user_email });
    
    res.status(201).json({ 
      success: true,
      message: 'Class registered successfully',
      classId: result.id // Changed from insertId to id
    });
  } catch (err) {
    console.error('Error registering class:', err);
    res.status(500).json({ message: 'Error registering class' });
  }
};

// Fetch classes by user
export const getAllClasses = async (req, res) => {
  try {
    const user_email = req.user_email;

    if (!user_email) {
      return res.status(400).json({ message: 'User email is required' });
    }

    const results = await getClassesByUser(user_email);
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
    const { class_name, tuition_fees, teacher_name } = req.body;

    if (!classId || !class_name || !tuition_fees || !teacher_name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const results = await updateClass(classId, { class_name, tuition_fees, teacher_name });
    
    if (results.rowCount === 0) { // Changed from affectedRows to rowCount
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
    
    if (results.rowCount === 0) { // Changed from affectedRows to rowCount
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