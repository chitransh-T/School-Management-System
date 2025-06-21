import { createFeeFieldsInDB, getFeeFieldsFromDB } from '../models/feeMasterModel.js';
import { getActiveSessionFromDB } from '../models/sessionModel.js';

export const createFeeFields = async (req, res) => {
  try {
    const { fee_fields } = req.body; // array of objects with fee_name, is_one_time, is_common_for_all_classes
    const signup_id = req.signup_id;

    if (!Array.isArray(fee_fields) || fee_fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one fee field is required',
      });
    }

    const session = await getActiveSessionFromDB(signup_id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found. Please create a session first.',
      });
    }

    await createFeeFieldsInDB({
      session_id: session.id,
      signup_id,
      feeFields: fee_fields, // send whole array of objects
    });

    return res.status(200).json({
      success: true,
      message: 'Fee fields created successfully',
    });

  } catch (error) {
    console.error('Error creating fee fields:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// controller/feemaster.controller.js

export const getFeeFields = async (req, res) => {
  try {
    const signup_id = req.signup_id;

    const session = await getActiveSessionFromDB(signup_id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found.',
      });
    }

    const feeFields = await getFeeFieldsFromDB(signup_id, session.id);

    return res.status(200).json({
      success: true,
      data: feeFields,
    });
  } catch (error) {
    console.error('Error fetching fee fields:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};