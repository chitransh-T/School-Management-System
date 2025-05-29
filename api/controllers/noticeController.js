import * as NoticeModel from '../models/noticeModel.js';

// GET /api/notices
export const getAllNotices = (req, res) => {
  const user_email = req.user_email;

  NoticeModel.getAllNotices(user_email, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, data: results });
  });
};

// POST /api/notices
export const createNotice = (req, res) => {
  const { title, content, notice_date, category, priority } = req.body;
  const user_email = req.user_email;

  if (!title || !content) {
    return res.status(400).json({ success: false, error: 'Title and content are required' });
  }

  const noticeData = {
    title,
    content,
    notice_date: notice_date || new Date().toISOString().split('T')[0],
    category: category || 'General',
    priority: priority || 'Normal',
    user_email
  };

  NoticeModel.createNotice(noticeData, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.status(201).json({ 
      success: true, 
      message: 'Notice created', 
      data: { id: result.id, ...noticeData }
    });
  });
};

// DELETE /api/notices/:id
export const deleteNotice = (req, res) => {
  const id = req.params.id;
  const user_email = req.user_email;

  NoticeModel.deleteNotice(id, user_email, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notice not found or you do not have permission to delete it' 
      });
    }

    res.json({ success: true, message: 'Notice deleted' });
  });
};
