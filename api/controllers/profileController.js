import path from 'path';
import { upsertProfile, getProfileBySchoolId } from '../models/profileModel.js';

export const saveOrUpdateProfile = async (req, res) => {
  try {
    const { institute_name, address } = req.body;
    const signup_id = req.signup_id;  // use signup_id instead of user_email

    if (!institute_name || !address || !signup_id) {
      return res.status(400).json({ 
        success: false,
        message: 'Institute name, address, and signup ID are required' 
      });
    }

    if (!req.files?.['logo']) {
      return res.status(400).json({ 
        success: false,
        message: 'Logo file is required' 
      });
    }

    const logoFile = req.files['logo'][0];
    const logo = path.basename(logoFile.path);

    const result = await upsertProfile({
      institute_name,
      address,
      logo: logo,
      signup_id,
    });

    res.status(201).json({
      success: true,
      message: 'Profile saved successfully',
      data: {
        ...result.rows[0],
        logo_url: `/uploads/${logo}` // Return URL for frontend
      }
    });
  } catch (err) {
    console.error('Error saving profile:', err);
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
      logo_url:   profile.logo ? `/uploads/${path.basename(profile.logo.replace(/\\/g, '/'))}` : null,
    };

    res.status(200).json({
      success: true,
      data: normalizedProfile,
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};