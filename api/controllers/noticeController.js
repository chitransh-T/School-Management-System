import * as NoticeModel from '../models/noticeModel.js';

// GET /api/notices
export const getAllNotices = (req, res) => {
  const signup_id = req.signup_id;

  NoticeModel.getAllNotices(signup_id, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, data: results });
  });
};

// POST /api/notices
export const createNotice = (req, res) => {
  const { title, content, notice_date, end_date, category, priority } = req.body;
const signup_id = req.signup_id;

if (!title || !content) {
  return res.status(400).json({ success: false, error: 'Title and content are required' });
}

const today = new Date().toISOString().split('T')[0];
const isValidNoticeDate = notice_date && notice_date.trim() !== '';
const isValidEndDate = end_date && end_date.trim() !== '';

const noticeData = {
  title,
  content,
  notice_date: isValidNoticeDate ? notice_date : today,
  end_date: isValidEndDate ? end_date : today,  // Default end_date = today if not provided
  category: category || 'General',
  priority: priority || 'Normal',
  signup_id
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
  const signup_id = req.signup_id;

  NoticeModel.deleteNotice(id, signup_id, (err, result) => {
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