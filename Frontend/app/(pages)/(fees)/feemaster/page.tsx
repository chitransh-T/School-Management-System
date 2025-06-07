"use client"
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
interface FeeField {
  id: string;
  feeName: string;
}

export default function FeeMasterPage() {
  const [session, setSession] = useState('');
  const [feeFields, setFeeFields] = useState<FeeField[]>([{ id: uuidv4(), feeName: '' }]);
  const [formErrors, setFormErrors] = useState({ session: '', fees: [] as string[] });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = {
      session: session.trim() === '' ? 'Please enter session' : '',
      fees: feeFields.map((field) =>
        field.feeName.trim() === '' ? 'Please enter a fee name' : ''
      ),
    };

    setFormErrors(errors);

    const hasErrors = errors.session !== '' || errors.fees.some((err) => err !== '');

    if (!hasErrors) {
      const feeNames = feeFields.map((field) => field.feeName.trim());
      console.log('Session:', session);
      console.log('Fee Fields:', feeNames);
      alert('Fees submitted successfully!');
    }
  };

  return (
    <DashboardLayout>
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-blue-900 mb-4">Fee Master</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SESSION INPUT */}
        <div>
          <label className="block text-blue-800 font-medium mb-1">
            Session (e.g. Apr 2020 - Apr 2021)
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md p-2"
            value={session}
            onChange={(e) => setSession(e.target.value)}
          />
          {formErrors.session && (
            <p className="text-red-500 text-sm mt-1">{formErrors.session}</p>
          )}
        </div>

        {/* FEE FIELD LIST */}
        <div>
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Add Fee Fields</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {feeFields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white"
              >
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

        {/* ADD BUTTON */}
        <button
          type="button"
          onClick={handleAddFeeField}
          className="bg-blue-100 text-blue-800 font-medium py-2 px-4 rounded-md hover:bg-blue-200"
        >
          + Add Fee Field
        </button>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          className="w-full bg-blue-800 text-white py-3 rounded-md hover:bg-blue-900"
        >
          Add fields
        </button>
      </form>
    </div>
    </DashboardLayout>
  );
}