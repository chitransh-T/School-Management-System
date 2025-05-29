


import pool from '../config/db.js';
import { createSubject, deleteSubjectById, getSubjectsByUser } from '../models/subjectModel.js';

// ✅ Register subjects
export const registerSubject = async (req, res) => {
  try {
    const { class_name, section, subject_name, marks } = req.body;
    const user_email = req.user_email;

    if (!class_name || !section || !subject_name || !marks || !user_email) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check existing subjects
    const checkQuery = 'SELECT id FROM subjects WHERE class_name = $1 AND section = $2 AND user_email = $3';
    const checkResult = await pool.query(checkQuery, [class_name, section, user_email]);

    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This class already has subjects assigned. Please use update instead.',
        existingClass: class_name,
      });
    }

    // Create new subject
    const newSubject = await createSubject({ 
      class_name, 
      section, 
      subject_name, 
      marks, 
      user_email 
    });

    res.status(201).json({
      success: true,
      message: 'Subjects registered successfully',
      data: newSubject
    });
  } catch (err) {
    console.error('Error registering subject:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error registering subjects' 
    });
  }
};

// ✅ Get all subjects
export const getAllSubjects = async (req, res) => {
  try {
    const user_email = req.user_email;

    if (!user_email) {
      return res.status(400).json({ message: 'User email is required' });
    }

    // Get valid classes
    const classResult = await pool.query(
      'SELECT class_name FROM classes WHERE user_email = $1',
      [user_email]
    );
    const validClasses = classResult.rows.map(c => c.class_name);

    // Get subjects
    const subjects = await getSubjectsByUser(user_email);

    // Filter and transform data
    const filteredResults = subjects.filter(subject => 
      validClasses.includes(subject.class_name)
    );
    
    const classSubjectsMap = filteredResults.reduce((acc, subject) => {
      if (!acc[subject.class_name]) {
        acc[subject.class_name] = {
          _id: subject.id,
          class_name: subject.class_name,
          section: subject.section || 'Unknown',
          user_email: subject.user_email,
          subjects: [],
        };
      }
      
      acc[subject.class_name].subjects.push({
        subject_name: subject.subject_name,
        marks: subject.marks,
      });
      
      return acc;
    }, {});

    res.status(200).json({ data: Object.values(classSubjectsMap) });
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ message: 'Error fetching subjects' });
  }
};

// ✅ Update subject
export const updateSubject = async (req, res) => {
  try {
    const { subject_id, subjects } = req.body;
    const user_email = req.user_email;

    if (!subject_id || !subjects || !user_email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    const combinedSubjectNames = subjects.map(s => s.subject_name).join(', ');
    const combinedMarks = subjects.map(s => s.marks).join(', ');
    const class_name = subjects[0].class_name;

    const updateQuery = `
      UPDATE subjects 
      SET class_name = $1, subject_name = $2, marks = $3
      WHERE id = $4 AND user_email = $5
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      class_name,
      combinedSubjectNames,
      combinedMarks,
      subject_id,
      user_email
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No subject found with that ID for this user' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subjects updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating subject:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Database operation failed' 
    });
  }
};

// ✅ Delete subject by ID
export const deleteSubject = async (req, res) => {
  try {
    const { subject_id } = req.params;
    const user_email = req.user_email;

    if (!subject_id || !user_email) {
      return res.status(400).json({
        success: false,
        message: 'Subject ID and user email are required',
      });
    }

    const result = await deleteSubjectById(subject_id, user_email);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No subject found with the provided ID for this user',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting subject:', err);
    res.status(500).json({
      success: false,
      message: 'Database error while deleting subject',
    });
  }
};