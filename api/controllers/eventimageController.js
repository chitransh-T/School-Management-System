

import path from 'path';
import { insertEventImage , getEventImagesByParentSignupId} from '../models/eventimageModel.js';
import pool from '../config/db.js';

export const uploadEventImages = async (req, res) => {
  try {
    const signup_id = req.signup_id;
    const { title } = req.body;
    const files = req.files?.['event_images'];

    if (!signup_id || !title || !files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Signup ID, title, and at least one image are required',
      });
    }

    // Get teacher_id and class_id from joined tables
    const result = await pool.query(`
      SELECT t.id AS teacher_id, c.id AS class_id
      FROM teacher t
      JOIN classes c ON c.teacher_id = t.id
      WHERE t.signup_id = $1
      LIMIT 1
    `, [signup_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assigned class for teacher not found',
      });
    }

    const { teacher_id, class_id } = result.rows[0];
    console.log('Resolved IDs:', { teacher_id, class_id });

    const uploadedImages = [];

    for (const file of files) {
      const image = path.basename(file.path);
      console.log('Inserting event image:', { teacher_id, class_id, title, image });

      const saved = await insertEventImage({
        teacher_id,
        class_id,
        title,
        image
      });

      uploadedImages.push({
        ...saved,
        image_url: `/uploads/${image}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event images uploaded successfully',
      data: uploadedImages,
    });
  } catch (err) {
    console.error('Error uploading event images:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: err.message,
    });
  }
};



export const getTeacherEventImages = async (req, res) => {
  try {
    const signup_id = req.signup_id;

    if (!signup_id) {
      return res.status(400).json({
        success: false,
        message: 'Signup ID is required',
      });
    }

    // Get teacher ID based on signup ID
    const teacherQuery = await pool.query(
      `SELECT id FROM teacher WHERE signup_id = $1 LIMIT 1`,
      [signup_id]
    );

    if (teacherQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    const teacher_id = teacherQuery.rows[0].id;

    // Fetch event images uploaded by this teacher
    const imageQuery = await pool.query(
      `
      SELECT ei.id, ei.title, ei.image, ei.created_at, ei.class_id,
             c.class_name, c.section
      FROM event_images ei
      LEFT JOIN classes c ON ei.class_id = c.id
      WHERE ei.teacher_id = $1
      ORDER BY ei.created_at DESC
      `,
      [teacher_id]
    );

    const images = imageQuery.rows.map(img => ({
      ...img,
      image_url: `/uploads/${img.image}` // Adjust path as needed
    }));

    res.status(200).json({
      success: true,
      message: 'Event images fetched successfully',
      data: images,
    });

  } catch (error) {
    console.error('Error in getTeacherEventImages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event images',
      error: error.message,
    });
  }
};



//---


export const getEventImagesForParent = async (req, res) => {
  try {
    const parentSignupId = req.signup_id; // from verifyToken

    if (!parentSignupId) {
      return res.status(400).json({ success: false, message: 'Missing parent signup ID' });
    }

    const images = await getEventImagesByParentSignupId(parentSignupId);

    res.status(200).json({
      success: true,
      message: 'Event images fetched successfully',
      data: images,
    });
  } catch (err) {
    console.error('❌ Error fetching event images for parent:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event images',
      error: err.message,
    });
  }
}