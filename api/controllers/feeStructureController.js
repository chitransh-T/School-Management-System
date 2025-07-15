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

    // ✅ Check if fee structure already exists for the class in current session
    const existingStructure = await getFeeStructureByClassFromDB({ class_id, signup_id, session_id });

    if (existingStructure.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Fee structure already exists for this class in the current session. You can only update it after the session ends.',
      });
    }

    // ✅ Save new structure (no deletion since nothing exists yet)
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
    const rawData = await getFeeStructureByClassFromDB({ signup_id, session_id, class_id });

    // Map the data to match frontend expectations
    const data = rawData.map(row => ({
      fee_master_id: row.fee_master_id,
      fee_field_name: row.fee_field_name,
      amount: Number(parseFloat(row.amount).toFixed(2)),
      is_one_time: !!row.is_one_time,
      is_monthly: !!row.is_monthly,
      is_mandatory: !!row.is_mandatory,
      is_collectable: !!row.is_collectable,
    }));

    console.log('Final mapped fee structure:', JSON.stringify(data, null, 2));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('Error getting fee structure:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};