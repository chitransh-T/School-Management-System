
//   'use client';

// import React, { useState } from 'react';
// import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
// import { v4 as uuidv4 } from 'uuid';

// interface FeeField {
//   id: string;
//   feeName: string;
//   isOneTime: boolean;
//   isCommonForAllClasses: boolean;
//   amount?: number;
// }

// interface FormErrors {
//   fees: string[];
// }

// export default function FeeMasterPage() {
//   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

//   const [feeFields, setFeeFields] = useState<FeeField[]>([
//     { id: uuidv4(), feeName: '', isOneTime: false, isCommonForAllClasses: false },
//   ]);
//   const [formErrors, setFormErrors] = useState<FormErrors>({ fees: [''] });
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [existingFeeFields, setExistingFeeFields] = useState<string[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);

//   const handleChange = <K extends keyof FeeField>(
//     index: number,
//     key: K,
//     value: FeeField[K]
//   ) => {
//     const updated = [...feeFields];
//     updated[index][key] = value;
//     setFeeFields(updated);
//   };

//   const handleAddField = () => {
//     setFeeFields([
//       ...feeFields,
//       { id: uuidv4(), feeName: '', isOneTime: false, isCommonForAllClasses: false },
//     ]);
//   };

//   const handleRemoveField = (index: number) => {
//     if (feeFields.length > 1) {
//       const updated = [...feeFields];
//       updated.splice(index, 1);
//       setFeeFields(updated);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
  
//     const errors = {
//       fees: feeFields.map((field) =>
//         field.feeName.trim() === '' ? 'Please enter a fee name' : ''
//       ),
//     };
//     setFormErrors(errors);
//     const hasErrors = errors.fees.some((err) => err !== '');
  
//     if (hasErrors) return;
  
//     const payload = feeFields.map((field) => ({
//       fee_name: field.feeName.trim(),
//       is_one_time: field.isOneTime,
//       is_common_for_all_classes: field.isCommonForAllClasses,
//       amount: field.isCommonForAllClasses ? field.amount : null,
//     }));
  
//     setIsSubmitting(true);
  
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) throw new Error('Authentication token not found');
  
//       const response = await fetch(`${baseUrl}/api/createfee`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ fee_fields: payload }),
//       });
  
//       const data = await response.json();
  
//       if (response.ok && data.success) {
//         alert('Fee fields saved successfully');
//         // Optionally update any local state with returned data if backend sends it
//       if (data.data?.fee_fields) {
//         setExistingFeeFields(data.data.fee_fields);
//       }
//         setFeeFields([
//           {
//             id: uuidv4(),
//             feeName: '',
//             isOneTime: false,
//             isCommonForAllClasses: false,
//           },
//         ]);
//         setSuccess('Fee fields saved successfully');
//         setError(null);
//       } else {
//         alert(data.message || 'Failed to save fee fields');
//         setError(data.message || 'Failed to save fee fields');
//         setSuccess(null);
//       }
//     } catch (err) {
//       console.error('Error saving fee fields', err);
//       alert('Error saving fee fields');
//       setError('Error saving fee fields');
//       setSuccess(null);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };
  
//   return (
//     <DashboardLayout>
//       <form onSubmit={handleSubmit}>
//         <div className="min-h-screen bg-gray-100 p-6">
//           <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md">
//             <h1 className="text-2xl font-bold text-blue-900 mb-4">Fee Master</h1>
//             <h2 className="text-lg font-semibold text-blue-800 mb-4">Define Fee Fields</h2>
//             <p className="text-red-700 bg-red-100 border border-red-300 rounded p-3 text-sm mb-4">
//               ⚠️ You can create fee fields only once per session. Please review carefully before proceeding.
//             </p>
//             <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
//               {feeFields.map((field, index) => (
//                 <div
//                   key={field.id}
//                   className="border rounded-xl p-4 bg-gray-50 shadow-sm relative"
//                 >
//                   <div className="flex justify-between items-center mb-4">
//                     <span className="font-semibold text-blue-800">Fee {index + 1}</span>
//                     {feeFields.length > 1 && (
//                       <button
//                         type="button"
//                         onClick={() => handleRemoveField(index)}
//                         className="text-red-500 hover:text-red-700 text-sm"
//                       >
//                         Remove
//                       </button>
//                     )}
//                   </div>

//                   <div className="mb-4">
//                     <label className="block text-sm text-gray-700 font-medium mb-1">Fee Name</label>
//                     <input
//                       type="text"
//                       value={field.feeName}
//                       onChange={(e) => handleChange(index, 'feeName', e.target.value)}
//                       className="w-full border text-gray-700 border-gray-300 rounded px-3 py-2"
//                       required
//                     />
//                     {formErrors.fees[index] && (
//                       <p className="text-red-500 text-sm">{formErrors.fees[index]}</p>
//                     )}
//                   </div>

//                   <div className="flex items-center gap-3 text-gray-700 mb-2">
//                     <input
//                       type="checkbox"
//                       checked={field.isOneTime}
//                       onChange={(e) => handleChange(index, 'isOneTime', e.target.checked)}
//                     />
//                     <label>Is One Time?</label>
//                   </div>

//                   <div className="flex items-center text-gray-700 gap-3 mb-2">
//                     <input
//                       type="checkbox"
//                       checked={field.isCommonForAllClasses}
//                       onChange={(e) =>
//                         handleChange(index, 'isCommonForAllClasses', e.target.checked)
//                       }
//                     />
//                     <label>Same for All Classes?</label>
//                   </div>

//                   {field.isCommonForAllClasses && (
//                     <div className="mt-2">
//                       <label className="block text-sm font-medium mb-1">
//                         Amount (Same for All Classes)
//                       </label>
//                       <input
//                         type="number"
//                         className="w-full border border-gray-300 rounded px-3 py-2"
//                         value={field.amount ?? ''}
//                         onChange={(e) =>
//                           handleChange(index, 'amount', parseFloat(e.target.value))
//                         }
//                       />
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>

//             <div className="mt-6 space-y-3">
//               <button
//                 type="button"
//                 onClick={handleAddField}
//                 className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-200 text-sm"
//               >
//                 + Add Fee Field
//               </button>

//               <button
//                 type="submit"
//                 className="block w-full bg-blue-800 text-white font-semibold py-3 rounded-lg hover:bg-blue-900"
//                 disabled={isSubmitting}
//               >
//                 {isSubmitting ? 'Creating...' : 'Create Fee Fields'}
//               </button>

//               {error && <p className="text-red-600 text-sm">{error}</p>}
//               {success && <p className="text-green-600 text-sm">{success}</p>}
//             </div>
//           </div>
//         </div>
//       </form>
//     </DashboardLayout>
//   );
// }
'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { v4 as uuidv4 } from 'uuid';

interface FeeField {
  id: string;
  feeName: string;
  isOneTime: boolean;
  isCommonForAllClasses: boolean;
  amount?: number;
}

interface ExistingFeeField {
  id: string;
  fee_field_name: string;
  is_one_time: boolean;
  is_common_for_all_classes: boolean;
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
  const [existingFeeFields, setExistingFeeFields] = useState<ExistingFeeField[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [isDeletingField, setIsDeletingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch existing fee fields on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchExistingFeeFields(token);
    }
  }, []);

  const fetchExistingFeeFields = async (token: string) => {
    setIsLoadingExisting(true);
    try {
      const response = await fetch(`${baseUrl}/api/getfee`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setExistingFeeFields(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching existing fee fields:', err);
    } finally {
      setIsLoadingExisting(false);
    }
  };

  const deleteAllFeeFields = async () => {
    if (!confirm('Be sure before deleting all fee fields, as each record will be permanently deleted. This action cannot be undone.')) {
      return;
    }

    setIsDeletingField('all');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      const response = await fetch(`${baseUrl}/api/deleteallfee`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setExistingFeeFields([]);
        setSuccess('All fee fields deleted successfully');
        setError(null);
        alert('All fee fields deleted successfully');
      } else {
        alert(data.message || 'Failed to delete all fee fields');
        setError(data.message || 'Failed to delete all fee fields');
        setSuccess(null);
      }
    } catch (err) {
      console.error('Error deleting all fee fields:', err);
      alert('Error deleting all fee fields');
      setError('Error deleting all fee fields');
      setSuccess(null);
    } finally {
      setIsDeletingField(null);
    }
  };

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
        
        // Reset form
        setFeeFields([
          {
            id: uuidv4(),
            feeName: '',
            isOneTime: false,
            isCommonForAllClasses: false,
          },
        ]);
        
        // Refresh existing fee fields
        await fetchExistingFeeFields(token);
        
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
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md">
          <form onSubmit={handleSubmit}>
            <h1 className="text-2xl font-bold text-blue-900 mb-4">Fee Master</h1>
            <h2 className="text-lg font-semibold text-blue-800 mb-4">Define Fee Fields</h2>
            <p className="text-red-700 bg-yellow-100 border border-yellow-300 rounded p-3 text-sm mb-4">
            ⚠️ You can create fee fields only once per session. To make any edits afterward, you must first delete all existing fields and then create new ones. Please review carefully before proceeding.
            </p>
            
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
                {isSubmitting ? 'Creating...' : 'Create Fee Fields'}
              </button>

              {error && <p className="text-red-600 text-sm">{error}</p>}
              {success && <p className="text-green-600 text-sm">{success}</p>}
            </div>
          </form>

          {/* Existing Fee Fields Section - Below the form */}
          <div className="mt-8 border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-900">Existing Fee Fields</h2>
              {existingFeeFields.length > 0 && (
                <button
                  onClick={deleteAllFeeFields}
                  disabled={isDeletingField === 'all'}
                  className="bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200 text-sm disabled:opacity-50"
                  title="Delete all fee master fields"
                >
                  {isDeletingField === 'all' ? 'Deleting...' : 'Delete All Fee Master Fields'}
                </button>
              )}
            </div>

            {isLoadingExisting ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading existing fee fields...</div>
              </div>
            ) : existingFeeFields.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {existingFeeFields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-blue-800">
                        {field.fee_field_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">#{index + 1}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm">
                      {field.is_one_time && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          One Time
                        </span>
                      )}
                      {field.is_common_for_all_classes && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Same for All Classes
                        </span>
                      )}
                      {!field.is_one_time && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          Recurring
                        </span>
                      )}
                    </div>

                    {field.is_common_for_all_classes && field.amount != null && (
                      <div className="mt-2 text-sm text-gray-700">
                        <strong>Fixed Amount: ₹{field.amount}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <div>No fee fields created yet</div>
                <div className="text-sm">Create your first fee field using the form above</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}