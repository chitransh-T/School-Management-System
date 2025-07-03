


import pool from '../config/db.js';

class MessageModel {
  async sendMessage(studentId, message, signupId) {
    try {
      const query = `
        INSERT INTO TeacherSentMessages (student_id, text, signup_id, created_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING id
      `;
      const values = [studentId, message, signupId];
      const result = await pool.query(query, values);
      
      if (!result.rows[0]?.id) {
        throw new Error('Failed to insert message');
      }
    } catch (error) {
      console.error('Database error in sendMessage:', error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  async getSentMessages(signupId) {
    try {
      const query = `
        SELECT tm.id, tm.student_id, s.student_name AS student_name, tm.text AS message, tm.created_at, tm.signup_id
        FROM TeacherSentMessages tm
        JOIN students s ON s.id = tm.student_id
        WHERE tm.signup_id = $1
        ORDER BY tm.created_at DESC
      `;
      const values = [signupId];
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Database error in getSentMessages:', error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  async getMessageById(messageId) {
    try {
      const query = `
        SELECT id, signup_id
        FROM TeacherSentMessages
        WHERE id = $1
      `;
      const values = [messageId];
      const result = await pool.query(query, values);
      if (result.rowCount === 0) {
        throw new Error('Message not found');
      }
      return result.rows[0];
    } catch (error) {
      console.error('Database error in getMessageById:', error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  async deleteMessage(messageId) {
    try {
      const query = 'DELETE FROM TeacherSentMessages WHERE id = $1 RETURNING *';
      const values = [messageId];
      const result = await pool.query(query, values);
      if (result.rowCount === 0) {
        throw new Error('Message not found');
      }
      return result.rows[0];
    } catch (error) {
      console.error('Database error in deleteMessage:', error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // ✅ NEW METHOD: Fetch teacher messages for a parent based on linked students
  async getTeacherMessagesForParent(parentSignupId) {
    try {
      const query = `
        SELECT
          tsm.id AS message_id,
          tsm.text AS message,
          tsm.created_at,
          s.student_name,
          tsm.signup_id AS teacher_signup_id
        FROM teachersentmessages tsm
        JOIN students s ON s.id = tsm.student_id
        JOIN parent_student_link psl ON psl.student_id = s.id
        WHERE psl.parent_signup_id = $1
        ORDER BY tsm.created_at DESC
      `;
      const values = [parentSignupId];
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Database error in getTeacherMessagesForParent:', error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
  }
 
}

export { MessageModel };