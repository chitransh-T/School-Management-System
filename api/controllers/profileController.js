import path from 'path';
import { upsertProfile, getProfileBySchoolId } from '../models/profileModel.js';
import pool from '../config/db.js';

export const saveOrUpdateProfile = async (req, res) => {
  try {
    const { institute_name, address } = req.body;
    const signup_id = req.signup_id;

    if (!institute_name || !address || !signup_id) {
      return res.status(400).json({ 
        success: false,
        message: 'Institute name, address, and signup ID are required' 
      });
    }

    // Logo optional banado:
    let logo;
    if (req.files?.['logo']) {
      const logoFile = req.files['logo'][0];
      logo = path.basename(logoFile.path);
    }

    // Agar logo available hai to uske sath update karo, nahi to bina logo ke update karo
    let result;
    if (logo) {
      result = await upsertProfile({
        institute_name,
        address,
        logo,
        signup_id,
      });
    } else {
      // Logo nahi aaya, toh existing logo ko preserve karte hue update karo
      const query = `
        UPDATE institute_profiles
        SET institute_name = $1,
            address = $2
        WHERE signup_id = $3
        RETURNING *;
      `;
      result = await pool.query(query, [institute_name, address, signup_id]);
    }

    res.status(201).json({
      success: true,
      message: 'Profile saved successfully',
      data: {
        ...result.rows[0],
        logo_url: result.rows[0].logo ? `/uploads/${result.rows[0].logo}` : null
      }
    });

  } catch (err) {
    // console.error('Error saving profile:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to save profile',
      error: err.message 
    });
  }
};


export const getProfile = async (req, res) => {
  try {
    const signup_id = req.signup_id;

    if (!signup_id) {
      return res.status(400).json({
        success: false,
        message: 'Signup ID is required',
      });
    }

    const profile = await getProfileBySchoolId(signup_id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    const normalizedProfile = {
      ...profile,
      logo: profile.logo ? path.basename(profile.logo.replace(/\\/g, '/')) : null,
      logo_url: profile.logo ? `/uploads/${path.basename(profile.logo.replace(/\\/g, '/'))}` : null,
    };

    res.status(200).json({
      success: true,
      data: normalizedProfile,
    });
  } catch (err) {
    // console.error('Error fetching profile:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};
