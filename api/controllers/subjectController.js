import pool from '../config/db.js';
import { createSubject, deleteSubjectById, getSubjectsByUser } from '../models/subjectModel.js';
import { getActiveSessionFromDB } from '../models/sessionModel.js';

// Helper function to get active session
const getActiveSession = async (signupId) => {
  const sessionResult = await pool.query(
    'SELECT id FROM sessions WHERE signup_id = $1 AND is_active = true',
    [signupId]
  );
  return sessionResult.rows[0];
};

// ✅ Register subjects
export const registerSubject = async (req, res) => {
  try {
    const { class_id, subjects } = req.body;
    const signup_id = req.signup_id;

    if (!class_id || !subjects || !subjects.length || !signup_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Check existing subjects for the class
    const checkQuery = 'SELECT id FROM subjects WHERE class_id = $1 AND signup_id = $2';
    const checkResult = await pool.query(checkQuery, [class_id, signup_id]);

    // Get active session
    const activeSession = await getActiveSessionFromDB(signup_id);
    if (!activeSession) {
      return res.status(400).json({ 
        success: false,
        message: 'No active session found for this school' 
      });
    }

    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This class already has subjects assigned. Please use update instead.',
        existingClass: class_id,
      });
    }

    // Create multiple subjects
    const newSubjects = [];
    for (const subject of subjects) {
      const { subject_name, marks } = subject;
      if (!subject_name || !marks) {
        return res.status(400).json({ 
          success: false, 
          message: 'Each subject must have a name and marks' 
        });
      }
      const newSubject = await createSubject({
        class_id,
        subject_name,
        marks,
        signup_id,
        session_id: activeSession.id,
      });
      newSubjects.push(newSubject);
    }

    res.status(201).json({
      success: true,
      message: 'Subjects registered successfully',
      data: newSubjects,
    });
  } catch (err) {
    console.error('Error registering subject:', err);
    res.status(500).json({
      success: false,
      message: 'Error registering subjects',
    });
  }
};

// ✅ Get all subjects
export const getAllSubjects = async (req, res) => {
  try {
    const signup_id = req.signup_id;

    if (!signup_id) {
      return res.status(400).json({ 
        success: false,
        message: 'signup id is required' 
      });
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
          id: subject.class_id.toString(),
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

    res.status(200).json({ 
      success: true,
      data: Object.values(classSubjectsMap) 
    });
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching subjects' 
    });
  }
};

// ✅ Update subjects
export const updateSubject = async (req, res) => {
  try {
    const { class_id, subjects } = req.body;
    const signup_id = req.signup_id;

    if (!class_id || !subjects || !subjects.length || !signup_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Get active session
    const activeSession = await getActiveSession(signup_id);
    if (!activeSession) {
      return res.status(400).json({ 
        success: false,
        message: 'No active session found for this school' 
      });
    }

    const results = [];
    
    for (const subject of subjects) {
      const { id, subject_name, marks } = subject;
      
      if (!subject_name || !marks) {
        return res.status(400).json({ 
          success: false, 
          message: 'Each subject must have name and marks' 
        });
      }

      if (id) {
        // Update existing subject
        const updateResult = await pool.query(
          `UPDATE subjects 
           SET subject_name = $1, marks = $2, class_id = $3
           WHERE id = $4 AND signup_id = $5
           RETURNING *`,
          [subject_name, marks, class_id, id, signup_id]
        );
        
        if (updateResult.rowCount === 0) {
          return res.status(404).json({
            success: false,
            message: `Subject with ID ${id} not found`
          });
        }
        
        results.push(updateResult.rows[0]);
      } else {
        // Create new subject
        const insertResult = await pool.query(
          `INSERT INTO subjects 
           (subject_name, marks, class_id, signup_id, session_id) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING *`,
          [subject_name, marks, class_id, signup_id, activeSession.id]
        );
        
        results.push(insertResult.rows[0]);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Subjects updated successfully',
      data: results
    });
  } catch (err) {
    console.error('Error updating subjects:', err);
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