

import path from 'path';
import { insertEventImage, getEventImagesByTeacherSignupId, getEventImagesByParentSignupId, getEventImagesBySchoolId, deleteEventImageByPrincipal} from '../models/eventimageModel.js';
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

    // Verify the user is a teacher and get teacher_id and class_id
    const result = await pool.query(`
      SELECT t.id AS teacher_id, c.id AS class_id
      FROM teacher t
      JOIN classes c ON c.teacher_id = t.id
      JOIN signup s ON t.signup_id = s.id
      WHERE t.signup_id = $1 AND s.role = 'teacher'
      LIMIT 1
    `, [signup_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assigned class for teacher not found or user is not a teacher',
      });
    }

    const { teacher_id, class_id } = result.rows[0];

    const uploadedImages = [];

    for (const file of files) {
      const image = path.basename(file.path);
      const saved = await insertEventImage({
        teacher_id,
        class_id,
        title,
        image,
        signup_id, // Include signup_id
      });

      uploadedImages.push({
        ...saved,
        image_url: `/Uploads/${image}`
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

    const images = await getEventImagesByTeacherSignupId(signup_id);

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

export const getEventImagesForParent = async (req, res) => {
  try {
    const parentSignupId = req.signup_id;

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
};

export const deleteEventImage = async (req, res) => {
  try {
    const signup_id = req.signup_id;
    const { image_id } = req.params;

    if (!signup_id || !image_id) {
      return res.status(400).json({
        success: false,
        message: 'Signup ID and image ID are required',
      });
    }

    // Verify the user is a teacher
    const teacherQuery = await pool.query(
      `SELECT id FROM signup WHERE id = $1 AND role = 'teacher' LIMIT 1`,
      [signup_id]
    );

    if (teacherQuery.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'User is not a teacher',
      });
    }

    // Check if the image belongs to this teacher's signup_id
    const imageQuery = await pool.query(
      `SELECT id FROM event_images WHERE id = $1 AND signup_id = $2`,
      [image_id, signup_id]
    );

    if (imageQuery.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized or image not found',
      });
    }

    // Delete the image
    await pool.query(
      `DELETE FROM event_images WHERE id = $1`,
      [image_id]
    );

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteEventImage:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting event image',
      error: error.message,
    });
  }
};

export const getPrincipalEventImages = async (req, res) => {
  try {
    const signup_id = req.signup_id;

    if (!signup_id) {
      return res.status(400).json({
        success: false,
        message: 'Signup ID is required',
      });
    }

    // Verify the user is a principal and get school_id
    const principalQuery = await pool.query(
      `SELECT school_id FROM signup WHERE id = $1 AND role = 'principal' LIMIT 1`,
      [signup_id]
    );

    if (principalQuery.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'User is not a principal or not found',
      });
    }

    const { school_id } = principalQuery.rows[0];

    if (!school_id) {
      return res.status(400).json({
        success: false,
        message: 'Principal is not associated with a school',
      });
    }

    // Fetch all event images for the school
    const images = await getEventImagesBySchoolId(school_id);

    res.status(200).json({
      success: true,
      message: 'Event images fetched successfully',
      data: images,
    });
  } catch (error) {
    console.error('Error in getPrincipalEventImages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event images',
      error: error.message,
    });
  }
};

export const deletePrincipalEventImage = async (req, res) => {
  try {
    const signup_id = req.signup_id;
    const { image_id } = req.params;

    if (!signup_id || !image_id) {
      return res.status(400).json({
        success: false,
        message: 'Signup ID and image ID are required',
      });
    }

    // Verify the user is a principal and get school_id
    const principalQuery = await pool.query(
      `SELECT school_id FROM signup WHERE id = $1 AND role = 'principal' LIMIT 1`,
      [signup_id]
    );

    if (principalQuery.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'User is not a principal or not found',
      });
    }

    const { school_id } = principalQuery.rows[0];

    if (!school_id) {
      return res.status(400).json({
        success: false,
        message: 'Principal is not associated with a school',
      });
    }

    // Delete the image
    const deleted = await deleteEventImageByPrincipal(image_id, school_id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Image not found or not in principal\'s school',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error in deletePrincipalEventImage:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting event image',
      error: error.message,
    });
  }
};