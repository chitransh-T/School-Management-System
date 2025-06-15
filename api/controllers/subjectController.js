




import pool from '../config/db.js';
import { createSubject, deleteSubjectById, getSubjectsByUser } from '../models/subjectModel.js';

// ✅ Register subjects
export const registerSubject = async (req, res) => {
  try {
    const { class_id, subject_name, marks } = req.body;
    const signup_id = req.signup_id;

    if (!class_id  || !subject_name || !marks || !signup_id) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check existing subjects
    const checkQuery = 'SELECT id FROM subjects WHERE class_id = $1  AND signup_id = $2';
    const checkResult = await pool.query(checkQuery, [class_id, signup_id]);

    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This class already has subjects assigned. Please use update instead.',
        existingClass: class_id,
      });
    }

    // Create new subject
    const newSubject = await createSubject({ 
      class_id, 
      subject_name, 
      marks, 
      signup_id 
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
    const signup_id = req.signup_id;

    if (!signup_id) {
      return res.status(400).json({ message: 'User email is required' });
    }

    // Get valid classes
    const classResult = await pool.query(
      'SELECT class_name FROM classes WHERE signup_id = $1',
      [signup_id]
    );
    const validClasses = classResult.rows.map(c => c.class_name);

    // Get subjects
    const subjects = await getSubjectsByUser(signup_id);

    // Filter and transform data
    const filteredResults = subjects.filter(subject => 
      validClasses.includes(subject.class_name)
    );
   const classSubjectsMap = filteredResults.reduce((acc, subject) => {
  const key = `${subject.class_name}-${subject.section}`;

  if (!acc[key]) {
    acc[key] = {
      id: subject.class_id.toString(), // or subject.id
      class_name: subject.class_name,
      section: subject.section || 'Unknown',
      signup_id: subject.signup_id,
      subjects: [],
    };
  }

  acc[key].subjects.push({
    id: subject.id,
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
    const signup_id = req.signup_id;

    if (!subject_id || !subjects || !signup_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const combinedSubjectNames = subjects.map(s => s.subject_name).join(', ');
    const combinedMarks = subjects.map(s => s.marks).join(', ');
    // const class_id = subjects[0].class_id; // Use class_id now
    const { class_id } = req.body;

    const updateQuery = `
      UPDATE subjects 
      SET subject_name = $1, marks = $2, class_id = $3
      WHERE id = $4 AND signup_id = $5
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      combinedSubjectNames,
      combinedMarks,
      class_id,
      subject_id,
      signup_id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No subject found with that ID for this user',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subjects updated successfully',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating subject:', err);
    res.status(500).json({
      success: false,
      message: 'Database operation failed',
    });
  }
};

// ✅ Delete subject by ID
export const deleteSubject = async (req, res) => {
  try {
    const { subject_id } = req.params;
    const signup_id = req.signup_id;

    if (!subject_id || !signup_id) {
      return res.status(400).json({
        success: false,
        message: 'Subject ID and user email are required',
      });
    }

    const result = await deleteSubjectById(subject_id, signup_id);

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