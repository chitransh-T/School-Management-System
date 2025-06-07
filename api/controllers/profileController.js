import path from 'path';
import { upsertProfile, getProfileByUser } from '../models/profileModel.js';
import { uploadDir } from '../middlewares/upload.js';

export const saveOrUpdateProfile = async (req, res) => {
  try {
    const { institute_name, address } = req.body;
    const user_email = req.user_email;

    if (!institute_name || !address || !user_email) {
      return res.status(400).json({ 
        success: false,
        message: 'Institute name, address, and user email are required' 
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
      user_email,
    });

    res.status(201).json({
      success: true,
      message: 'Profile saved successfully',
      data: {
        ...result.rows[0],
        logo_url: `/uploads/${logo}` // ✅ Fixed: backticks were missing
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
    const user_email = req.user_email;

    if (!user_email) {
      return res.status(400).json({ 
        success: false,
        message: 'User email is required' 
      });
    }

    const profile = await getProfileByUser(user_email);

    if (!profile) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }

    const normalizedProfile = {
      ...profile,
      logo: profile.logo ? path.basename(profile.logo.replace(/\\/g, '/')) : null,
      logo_url: profile.logo ? `/uploads/${path.basename(profile.logo.replace(/\\/g, '/'))}` : null // ✅ Fixed
    };

    res.status(200).json({
      success: true,
      data: normalizedProfile
    });

  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: err.message 
    });
  }
};
