import { createFeeFieldsInDB, getFeeFieldsFromDB } from '../models/feeMasterModel.js';
import { getActiveSessionFromDB } from '../models/sessionModel.js';

// export const createFeeFields = async (req, res) => {
//   try {
//     const { fee_fields } = req.body; // array of objects with fee_name, is_one_time, is_common_for_all_classes
//     const signup_id = req.signup_id;

//     if (!Array.isArray(fee_fields) || fee_fields.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'At least one fee field is required',
//       });
//     }

//     const session = await getActiveSessionFromDB(signup_id);

//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: 'No active session found. Please create a session first.',
//       });
//     }

//     await createFeeFieldsInDB({
//       session_id: session.id,
//       signup_id,
//       feeFields: fee_fields, // send whole array of objects
//     });

//     return res.status(200).json({
//       success: true,
//       message: 'Fee fields created successfully',
//     });

//   } catch (error) {
//     console.error('Error creating fee fields:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//     });
//   }
// };
export const createFeeFields = async (req, res) => {
  try {
    const { fee_fields } = req.body;
    const signup_id = req.signup_id;

    if (!Array.isArray(fee_fields) || fee_fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one fee field is required',
      });
    }

    // ✅ Get Active Session
    const session = await getActiveSessionFromDB(signup_id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found. Please create a session first.',
      });
    }

    // ✅ Check if fee fields already exist for the session
    const existingFeeFields = await getFeeFieldsFromDB(signup_id, session.id);

    if (existingFeeFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Fee fields already exist for session "${session.session_name}" (ends on ${session.end_date}). You can add new fields only in the next session.`,
      });
    }

    // ✅ Check if session has already expired
    const currentDate = new Date();
    const sessionEndDate = new Date(session.end_date);
    if (currentDate > sessionEndDate) {
      return res.status(400).json({
        success: false,
        message: `This session expired on ${sessionEndDate.toISOString().split('T')[0]}. Please create a new session to add fee fields.`,
      });
    }

    // ✅ Proceed to create fee fields
    await createFeeFieldsInDB({
      session_id: session.id,
      signup_id,
      feeFields: fee_fields,
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
