
  'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { v4 as uuidv4 } from 'uuid';

interface FeeField {
  id: string;
  feeName: string;
  isOneTime: boolean;
  isCommonForAllClasses: boolean;
  amount?: number;
}

interface FormErrors {
  fees: string[];
}

export default function FeeMasterPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [feeFields, setFeeFields] = useState<FeeField[]>([
    { id: uuidv4(), feeName: '', isOneTime: false, isCommonForAllClasses: false },
  ]);
  const [formErrors, setFormErrors] = useState<FormErrors>({ fees: [''] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingFeeFields, setExistingFeeFields] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = <K extends keyof FeeField>(
    index: number,
    key: K,
    value: FeeField[K]
  ) => {
    const updated = [...feeFields];
    updated[index][key] = value;
    setFeeFields(updated);
  };

  const handleAddField = () => {
    setFeeFields([
      ...feeFields,
      { id: uuidv4(), feeName: '', isOneTime: false, isCommonForAllClasses: false },
    ]);
  };

  const handleRemoveField = (index: number) => {
    if (feeFields.length > 1) {
      const updated = [...feeFields];
      updated.splice(index, 1);
      setFeeFields(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const errors = {
      fees: feeFields.map((field) =>
        field.feeName.trim() === '' ? 'Please enter a fee name' : ''
      ),
    };
    setFormErrors(errors);
    const hasErrors = errors.fees.some((err) => err !== '');
  
    if (hasErrors) return;
  
    const payload = feeFields.map((field) => ({
      fee_name: field.feeName.trim(),
      is_one_time: field.isOneTime,
      is_common_for_all_classes: field.isCommonForAllClasses,
      amount: field.isCommonForAllClasses ? field.amount : null,
    }));
  
    setIsSubmitting(true);
  
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');
  
      const response = await fetch(`${baseUrl}/api/createfee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fee_fields: payload }),
      });
  
      const data = await response.json();
  
      if (response.ok && data.success) {
        alert('Fee fields saved successfully');
        // Optionally update any local state with returned data if backend sends it
      if (data.data?.fee_fields) {
        setExistingFeeFields(data.data.fee_fields);
      }
        setFeeFields([
          {
            id: uuidv4(),
            feeName: '',
            isOneTime: false,
            isCommonForAllClasses: false,
          },
        ]);
        setSuccess('Fee fields saved successfully');
        setError(null);
      } else {
        alert(data.message || 'Failed to save fee fields');
        setError(data.message || 'Failed to save fee fields');
        setSuccess(null);
      }
    } catch (err) {
      console.error('Error saving fee fields', err);
      alert('Error saving fee fields');
      setError('Error saving fee fields');
      setSuccess(null);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit}>
        <div className="min-h-screen bg-gray-100 p-6">
          <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md">
            <h1 className="text-2xl font-bold text-blue-900 mb-4">Fee Master</h1>
            <h2 className="text-lg font-semibold text-blue-800 mb-4">Define Fee Fields</h2>

            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
              {feeFields.map((field, index) => (
                <div
                  key={field.id}
                  className="border rounded-xl p-4 bg-gray-50 shadow-sm relative"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-blue-800">Fee {index + 1}</span>
                    {feeFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveField(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm text-gray-700 font-medium mb-1">Fee Name</label>
                    <input
                      type="text"
                      value={field.feeName}
                      onChange={(e) => handleChange(index, 'feeName', e.target.value)}
                      className="w-full border text-gray-700 border-gray-300 rounded px-3 py-2"
                      required
                    />
                    {formErrors.fees[index] && (
                      <p className="text-red-500 text-sm">{formErrors.fees[index]}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-gray-700 mb-2">
                    <input
                      type="checkbox"
                      checked={field.isOneTime}
                      onChange={(e) => handleChange(index, 'isOneTime', e.target.checked)}
                    />
                    <label>Is One Time?</label>
                  </div>

                  <div className="flex items-center text-gray-700 gap-3 mb-2">
                    <input
                      type="checkbox"
                      checked={field.isCommonForAllClasses}
                      onChange={(e) =>
                        handleChange(index, 'isCommonForAllClasses', e.target.checked)
                      }
                    />
                    <label>Same for All Classes?</label>
                  </div>

                  {field.isCommonForAllClasses && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium mb-1">
                        Amount (Same for All Classes)
                      </label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        value={field.amount ?? ''}
                        onChange={(e) =>
                          handleChange(index, 'amount', parseFloat(e.target.value))
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleAddField}
                className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-200 text-sm"
              >
                + Add Fee Field
              </button>

              <button
                type="submit"
                className="block w-full bg-blue-800 text-white font-semibold py-3 rounded-lg hover:bg-blue-900"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Fees'}
              </button>

              {error && <p className="text-red-600 text-sm">{error}</p>}
              {success && <p className="text-green-600 text-sm">{success}</p>}
            </div>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
