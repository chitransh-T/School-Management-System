
import pool from '../config/db.js';

class ParentMessageModel {
  // Send message from parent
  async sendMessage(studentId, message, signupId) {
    try {
      const query = `
        INSERT INTO ParentSentMessages (student_id, text, signup_id, created_at)
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

  // Get messages sent by a parent
  async getSentMessages(signupId) {
    try {
      const query = `
        SELECT tm.id, tm.student_id, s.student_name AS student_name, tm.text AS message, tm.created_at, tm.signup_id
        FROM ParentSentMessages tm
        JOIN students s ON s.id = tm.student_id
        WHERE tm.signup_id = $1
        ORDER BY tm.created_at DESC
      `;
      const values = [signupId];
      const result = await pool.query(query, values);
      console.log("getSentMessages result:", result.rows);
      return result.rows;
    } catch (error) {
      console.error("Database error in getSentMessages:", error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // Get a message by its ID
  async getMessageById(messageId) {
    try {
      const query = `
        SELECT id, signup_id
        FROM ParentSentMessages
        WHERE id = $1
      `;
      const values = [messageId];
      const result = await pool.query(query, values);
      if (result.rowCount === 0) {
        throw new Error("Message not found");
      }
      console.log("getMessageById result:", result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error("Database error in getMessageById:", error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // Delete message
  async deleteMessage(messageId, signupId) {
    try {
      const query = `
        DELETE FROM ParentSentMessages
        WHERE id = $1 AND signup_id = $2
        RETURNING id
      `;
      const values = [messageId, signupId];
      const result = await pool.query(query, values);
      if (result.rowCount === 0) {
        throw new Error("Message not found or not authorized");
      }
      console.log("deleteMessage result:", result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error("Database error in deleteMessage:", error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // ✅ Get all parent messages for students assigned to this teacher's classes
  // async getMessagesForTeacher(signupId) {
  //   try {
  //     const query = `
  //       SELECT
  //         psm.id AS message_id,
  //         psm.text,
  //         psm.created_at,
  //         s.student_name,
  //         c.class_name,
  //         c.section
  //       FROM ParentSentMessages psm
  //       JOIN students s ON s.id = psm.student_id
  //       JOIN classes c ON c.class_name = s.assigned_class AND c.section = s.assigned_section
  //       JOIN teacher t ON t.id = c.teacher_id
  //       WHERE t.signup_id = $1
  //       ORDER BY psm.created_at DESC
  //     `;
  //     const values = [signupId];
  //     const result = await pool.query(query, values);
  //     return result.rows;
  //   } catch (error) {
  //     console.error("Database error in getMessagesForTeacher:", error.stack);
  //     throw new Error(`Database error: ${error.message}`);
  //   }
  // }

  async getMessagesForTeacher(signupId) {
    console.log('📥 Querying messages for teacher signupId:', signupId);
    try {
      const query = `
        SELECT
          psm.id AS message_id,
          psm.text,
          psm.created_at,
          s.student_name,
          c.class_name,
          c.section
        FROM ParentSentMessages psm
        JOIN students s ON s.id = psm.student_id
        JOIN signup stu_signup ON stu_signup.id = s.signup_id
        JOIN classes c ON c.class_name = s.assigned_class AND c.section = s.assigned_section
        JOIN teacher t ON t.id = c.teacher_id
        JOIN signup teacher_signup ON teacher_signup.id = t.signup_id
        WHERE t.signup_id = $1
          AND teacher_signup.school_id = stu_signup.school_id
        ORDER BY psm.created_at DESC
      `;
      const values = [signupId];
      const result = await pool.query(query, values);
      console.log('📤 Messages returned from DB:', result.rows);
      return result.rows;
    } catch (error) {
      console.error("Database error in getMessagesForTeacher:", error.stack);
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

export { ParentMessageModel };