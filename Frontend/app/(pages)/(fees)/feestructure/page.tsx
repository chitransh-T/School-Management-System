'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';

type ClassItem = { id: string; className: string };
type FeeField = {
  id: string;
  label: string;
  defaultAmount?: number;
  isCommonForAll: boolean;
  amount: string;
  isCollectable: boolean;
};

export default function FeeStructurePage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [token, setToken] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [feeFields, setFeeFields] = useState<FeeField[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch token and load data on mount
  useEffect(() => {
    const tk = localStorage.getItem('token');
    if (tk) {
      setToken(tk);
      fetchClasses(tk);
      fetchFeeMasterFields(tk);
    }
  }, []);

  // Load fee structure for selected class
  useEffect(() => {
    const loadStructure = async () => {
      if (!selectedClassId || !token) return;
      try {
        setIsLoading(true);
        const res = await fetch(`${baseUrl}/api/feestructure/${selectedClassId}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const json = await res.json();
        if (res.ok && json.success) {
          const serverStruct: any[] = json.data || [];
          setFeeFields((prev) =>
            prev.map((f) => {
              const matched = serverStruct.find(
                (s) => s.fee_master_id?.toString() === f.id
              );
              return matched
                ? {
                    ...f,
                    amount:
                      matched.amount != null ? matched.amount.toString() : f.amount,
                    isCollectable: matched.is_collectable,
                  }
                : f;
            })
          );
        }
      } catch (err) {
        console.error('Failed to fetch fee structure', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadStructure();
  }, [selectedClassId, token]);

  // ✅ FIXED: Fetch and parse class list
  const fetchClasses = async (tk: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${baseUrl}/api/classes`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${tk}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const parsed = data.map((item: any) => ({
          id: item.id?.toString() ?? item._id?.toString() ?? '',
          className: item.class_name?.toString().trim() ?? 'Unnamed Class',
        }));
        setClasses(parsed);
      } else {
        console.error('Failed to fetch classes: HTTP', res.status);
      }
    } catch (e) {
      console.error('Error fetching classes:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeeMasterFields = async (tk: string) => {
    try {
      const fieldsRes = await fetch(`${baseUrl}/api/getfee`, {
        headers: { Authorization: `Bearer ${tk}` },
      });
      const fieldsJson = await fieldsRes.json();
      const parsed = (fieldsJson.data || []).map((f: any) => ({
        id: f.id.toString(),
        label: f.fee_field_name ?? 'Unnamed Fee',
        defaultAmount: f.amount != null ? Number(f.amount) : undefined,
        isCommonForAll: f.is_common_for_all_classes,
        amount:
          f.is_common_for_all_classes && f.amount != null
            ? f.amount.toString()
            : '',
        isCollectable: true,
      }));
      setFeeFields(parsed);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFieldChange = (
    idx: number,
    key: 'amount' | 'isCollectable',
    val: any
  ) => {
    const updated = [...feeFields];
    updated[idx] = { ...updated[idx], [key]: val };
    setFeeFields(updated);
  };

  const saveFeeStructure = async () => {
    if (!selectedClassId) {
      alert('Please select a class');
      return;
    }
    for (const field of feeFields) {
      if (!field.amount) {
        alert(`Please enter amount for ${field.label}`);
        return;
      }
    }
    setIsLoading(true);
    const structure = feeFields.map((f) => ({
      fee_master_id: parseInt(f.id, 10),
      amount: parseFloat(f.amount),
      is_collectable: f.isCollectable,
    }));
    try {
      const res = await fetch(`${baseUrl}/api/registerfee`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ class_id: selectedClassId, structure }),
      });
      const data = await res.json();
      alert(
        data.success ? 'Fee Structure saved successfully' : 'Failed to save Fee Structure'
      );
    } catch (e) {
      console.error(e);
      alert('Error saving Fee Structure');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4 text-blue-900">Fee Structure</h1>

        <div className="space-y-4">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full border text-gray-700 border-gray-300 rounded px-3 py-2"
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.className}
              </option>
            ))}
          </select>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {feeFields.map((f, i) => (
              <div key={f.id} className="border rounded p-4 bg-gray-50">
                <p className="font-semibold text-blue-800">{f.label}</p>
                <input
                  type="number"
                  value={f.amount}
                  readOnly={f.isCommonForAll && f.defaultAmount != null}
                  onChange={(e) => handleFieldChange(i, 'amount', e.target.value)}
                  className={`w-full border text-gray-700 border-gray-300 rounded mt-2 p-2 ${
                    f.isCommonForAll ? 'bg-gray-200' : ''
                  }`}
                  placeholder={f.isCommonForAll ? 'Fixed amount' : 'Enter amount'}
                />
                {!f.isCommonForAll && (
                  <label className="inline-flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={!f.isCollectable}
                      onChange={(e) =>
                        handleFieldChange(i, 'isCollectable', !e.target.checked)
                      }
                      className="form-checkbox"
                    />
                    <span className="ml-2 text-sm text-gray-700">Not Collectable</span>
                  </label>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={saveFeeStructure}
            className="w-full bg-blue-800 text-white py-3 rounded hover:bg-blue-900 transition"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Fee Structure'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
