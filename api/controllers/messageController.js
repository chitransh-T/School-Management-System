

import { MessageModel } from '../models/messageModel.js';

const messageModel = new MessageModel();

export async function sendMessage(req, res) {
  try {
    const { student_id, message } = req.body;
    const signup_id = req.signup_id;

    if (!student_id || !message || !signup_id) {
      return res.status(400).json({ error: 'Missing required fields: student_id, message, or signup_id' });
    }

    if (typeof student_id !== 'number' || typeof message !== 'string' || typeof signup_id !== 'number') {
      return res.status(400).json({ error: 'Invalid data types for student_id, message, or signup_id' });
    }

    if (message.length > 200) {
      return res.status(400).json({ error: 'Message exceeds 200 character limit' });
    }

    await messageModel.sendMessage(student_id, message, signup_id);
    return res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error.stack);
    return res.status(500).json({ error: `Failed to send message: ${error.message}` });
  }
}

export async function getSentMessages(req, res) {
  try {
    const signup_id = req.signup_id;
    if (!signup_id) {
      return res.status(401).json({ error: 'Unauthorized: No signup_id available' });
    }

    const messages = await messageModel.getSentMessages(signup_id);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch messages: ${error.message}` });
  }
}

export async function deleteSentMessage(req, res) {
  try {
    const { id } = req.params;
    const signup_id = req.signup_id;
    if (!signup_id) {
      return res.status(401).json({ error: 'Unauthorized: No signup_id available' });
    }

    const message = await messageModel.getMessageById(parseInt(id));
    if (message.signup_id !== signup_id) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own messages' });
    }

    await messageModel.deleteMessage(parseInt(id));
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    if (error.message === 'Message not found') {
      res.status(404).json({ error: 'Message not found' });
    } else {
      res.status(500).json({ error: `Failed to delete message: ${error.message}` });
    }
  }
}

export async function getTeacherMessagesForParent(req, res) {
  try {
    const parentSignupId = req.signup_id;
    if (!parentSignupId) {
      return res.status(401).json({ error: 'Unauthorized: No parent signup_id available' });
    }

    const messages = await messageModel.getTeacherMessagesForParent(parentSignupId);
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getTeacherMessagesForParent:", error.stack);
    res.status(500).json({ error: `Failed to fetch teacher messages: ${error.message}` });
  }
}
//------








