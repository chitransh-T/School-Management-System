import { createFeeStructure, deleteFeeStructureForClass,getFeeStructureByClassFromDB } from '../models/feeStructureModel.js';
import { getActiveSessionFromDB } from '../models/sessionModel.js';

// ✅ Register Fee Structure
export const registerFeeStructure = async (req, res) => {
  try {
    const { class_id, structure } = req.body;
    const signup_id = req.signup_id;

    if (!class_id || !structure || !Array.isArray(structure)) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // ✅ Get active session
    const activeSession = await getActiveSessionFromDB(signup_id);
    if (!activeSession) {
      return res.status(400).json({ message: 'No active session found for this school' });
    }

    const session_id = activeSession.id;

    // ✅ Delete old structure (optional for update)
    await deleteFeeStructureForClass({ class_id, signup_id, session_id });

    // ✅ Save new structure
    const inserted = await createFeeStructure({
      class_id,
      signup_id,
      session_id,
      structure
    });

    res.status(201).json({
      success: true,
      message: 'Fee structure registered successfully',
      data: inserted
    });
  } catch (err) {
    console.error('Error registering fee structure:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// ✅ Get Fee Structure for a Class
export const getFeeStructureByClass = async (req, res) => {
  try {
    const { class_id } = req.params;
    const signup_id = req.signup_id;

    if (!class_id) {
      return res.status(400).json({ success: false, message: 'Class ID is required' });
    }

    const activeSession = await getActiveSessionFromDB(signup_id);
    if (!activeSession) {
      return res.status(400).json({ message: 'No active session found' });
    }

    const session_id = activeSession.id;
    const data = await getFeeStructureByClassFromDB({ signup_id, session_id, class_id });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('Error getting fee structure:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};