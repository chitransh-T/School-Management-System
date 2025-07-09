import {
  createSessionInDB,
  getSessionsFromDB,
  updateSessionInDB,
  deleteSession,
  getActiveSessionFromDB,
} from '../models/sessionModel.js';
import { getTeachersBySessionId } from '../models/teacherModel.js';
import { getStudentsBySessionId } from '../models/studentModel.js';

export const createSession = async (req, res) => {
  try {
    const { session_name, start_date, end_date } = req.body;
    const signup_id = req.signup_id;
    const role = req.role;

    if (!session_name || !start_date || !end_date || !signup_id) {
      return res.status(400).json({
        success: false,
        message: 'All fields (session_name, start_date, end_date, signup_id) are required',
      });
    }

    if (role !== 'principal') {
      return res.status(403).json({
        success: false,
        message: 'Only principals are allowed to create sessions',
      });
    }

    // Check if there's an active session
    const activeSession = await getActiveSessionFromDB(signup_id);
    
    if (activeSession) {
      const currentDate = new Date();
      const activeSessionEndDate = new Date(activeSession.end_date);
      
      // Check if active session has ended
      if (currentDate <= activeSessionEndDate) {
        return res.status(400).json({
          success: false,
          message: `Cannot create new session. Current session is active until ${activeSessionEndDate.toISOString().split('T')[0]}`,
          activeSessionEndDate: activeSessionEndDate.toISOString().split('T')[0],
        });
      }
    }

    // Validate new session dates
    const newStartDate = new Date(start_date);
    const newEndDate = new Date(end_date);
    
    if (newStartDate >= newEndDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    // If there was an active session but it has ended, allow creating new session
    const result = await createSessionInDB({
      session_name,
      start_date,
      end_date,
      signup_id,
    });

    return res.status(200).json({
      success: true,
      message: 'Session created successfully',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error creating session:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// ... rest of the controller code remains the same ...
export const getSessions = async (req, res) => {
  try {
    const signup_id = req.signup_id;

    if (!signup_id) {
      return res.status(400).json({
        success: false,
        message: 'signup_id is required',
      });
    }

    const sessions = await getSessionsFromDB(signup_id);

    return res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateSession = async (req, res) => {
  try {
    const { id, session_name, start_date, end_date } = req.body;

    if (!id || !session_name || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'All fields (id, session_name, start_date, end_date) are required',
      });
    }

    const updatedSession = await updateSessionInDB({
      id,
      session_name,
      start_date,
      end_date,
    });

    if (!updatedSession) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or update failed',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Session updated successfully',
      data: updatedSession,
    });
  } catch (err) {
    console.error('Error updating session:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};

export const deleteSessions = async (req, res) => {
  const id = req.params.id;
  const signup_id = req.signup_id;

  try {
    // Check linked teachers
    const teachers = await getTeachersBySessionId(id);
    if (teachers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please delete all records related to this session first.',
      });
    }

    // Check linked students
    const students = await getStudentsBySessionId(id);
    if (students.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please delete all records related to this session first.',
      });
    }

    // Now delete the session
    deleteSession(id, signup_id, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Session not found or you do not have permission to delete it',
        });
      }

      res.json({ success: true, message: 'Session deleted' });
    });
  } catch (err) {
    console.error('Error in deleteSessions:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
//---

