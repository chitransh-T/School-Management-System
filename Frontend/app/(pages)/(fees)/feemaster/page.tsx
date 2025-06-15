"use client"
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
interface FeeField {
  id: string;
  feeName: string;
}

export default function FeeMasterPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [feeFields, setFeeFields] = useState<FeeField[]>([{ id: uuidv4(), feeName: '' }]);
  const [existingFeeFields, setExistingFeeFields] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formErrors, setFormErrors] = useState({ fees: [] as string[] });

  const handleAddFeeField = () => {
    setFeeFields([...feeFields, { id: uuidv4(), feeName: '' }]);
  };

  const handleRemoveFeeField = (index: number) => {
    if (feeFields.length > 1) {
      const newFields = [...feeFields];
      newFields.splice(index, 1);
      setFeeFields(newFields);
    }
  };

  useEffect(() => {
    const fetchFeeFields = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoading(false);
          return;
        }
        const response = await fetch(`${baseUrl}/api/getfeefields`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setExistingFeeFields(data.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch fee fields', err);
        setError('Failed to load fee fields');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeeFields();
  }, []);

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

    const feeNames = feeFields.map((field) => field.feeName.trim());
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
        body: JSON.stringify({ fee_fields: feeNames }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert('Fee fields saved successfully');
        setExistingFeeFields(data.data?.fee_fields || feeNames);
        setFeeFields([{ id: uuidv4(), feeName: '' }]);
      } else {
        alert(data.message || 'Failed to save fee fields');
      }
    } catch (err) {
      console.error('Error saving fee fields', err);
      alert('Error saving fee fields');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">Fee Master</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fee field list */}
          <div>
            <h2 className="text-lg font-semibold text-blue-900 mb-3">Add Fee Fields</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {feeFields.map((field, index) => (
                <div key={field.id} className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-blue-800">Fee {index + 1}</span>
                    {feeFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFeeField(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        &#10005;
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Fee Name"
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={field.feeName}
                    onChange={(e) => {
                      const updatedFields = [...feeFields];
                      updatedFields[index].feeName = e.target.value;
                      setFeeFields(updatedFields);
                    }}
                  />
                  {formErrors.fees[index] && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.fees[index]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add button */}
          <button
            type="button"
            onClick={handleAddFeeField}
            className="bg-blue-100 text-blue-800 font-medium py-2 px-4 rounded-md hover:bg-blue-200"
          >
            + Add Fee Field
          </button>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-800 text-white py-3 rounded-md hover:bg-blue-900 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Add fields'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
     