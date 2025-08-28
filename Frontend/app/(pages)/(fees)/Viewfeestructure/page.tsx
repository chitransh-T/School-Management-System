

// 'use client';

// import React, { useEffect, useState } from 'react';
// import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';

// interface ClassItem {
//   id: string;
//   name: string;
// }

// interface FeeStructureItem {
//   fee_field_name: string;
//   amount: string;
//   is_collectable: boolean;
// }

// export default function ViewFeeStructurePage() {
//   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

//   const [token, setToken] = useState<string | null>(null);
//   const [classes, setClasses] = useState<ClassItem[]>([]);
//   const [selectedClassId, setSelectedClassId] = useState<string>('');
//   const [feeStructure, setFeeStructure] = useState<FeeStructureItem[]>([]);
//   const [isLoading, setIsLoading] = useState<boolean>(false);

//   useEffect(() => {
//     const tk = localStorage.getItem('token');
//     if (!tk) return;
//     setToken(tk);
//     fetchClasses(tk);
//   }, []);

//   const fetchClasses = async (tk: string) => {
//     try {
//       const res = await fetch(`${baseUrl}/api/classes`, {
//         method: 'GET',
//         headers: {
//           Authorization: `Bearer ${tk}`,
//         },
//       });

//       if (!res.ok) throw new Error('Failed to load classes');
//       const data = await res.json();

//       const uniqueClasses: { [coreName: string]: ClassItem } = {};
//       for (const item of data) {
//         const id = item.id?.toString() ?? item._id?.toString() ?? '';
//         const fullName = item.class_name?.toString() ?? '';
        
//         // Extract core class name (e.g., "Class 1" from "Class 1 Section A")
//         // Adjust this regex based on your class name format
//         const coreNameMatch = fullName.match(/^Class\s*\d+/i);
//         const coreName = coreNameMatch ? coreNameMatch[0] : fullName;

//         if (!uniqueClasses[coreName]) {
//           uniqueClasses[coreName] = { id, name: coreName }; // Store core name for display
//         }
//       }

//       setClasses(Object.values(uniqueClasses));
//     } catch (err) {
//       console.error('❌ Error fetching classes:', err);
//     }
//   };

//   const fetchFeeStructure = async (classId: string) => {
//     if (!token) return;
//     setIsLoading(true);
//     try {
//       const res = await fetch(`${baseUrl}/api/feestructure/${classId}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!res.ok) throw new Error('Failed to fetch fee structure');
//       const data = await res.json();

//       const parsed: FeeStructureItem[] = (data.data || []).map((item: any) => ({
//         fee_field_name: item.fee_field_name ?? 'Unknown Fee',
//         amount: item.amount?.toString() ?? '0',
//         is_collectable: item.is_collectable ?? true,
//       }));

//       setFeeStructure(parsed);
//     } catch (err) {
//       console.error('❌ Error fetching fee structure:', err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const value = e.target.value;
//     setSelectedClassId(value);
//     fetchFeeStructure(value);
//   };

//   return (
//     <DashboardLayout>
//       <div className="p-6">
//         <h1 className="text-2xl font-bold text-blue-900 mb-6">View Fee Structure</h1>

//         <div className="mb-6">
//           <label className="block font-medium mb-2 text-gray-700">Select Class</label>
//           <select
//             value={selectedClassId}
//             onChange={handleClassChange}
//             className="w-full border text-gray-700 border-gray-300 rounded px-3 py-2"
//           >
//             <option value="">-- Select Class --</option>
//             {classes.map((c) => (
//               <option key={c.id} value={c.id}>
//                 {c.name}
//               </option>
//             ))}
//           </select>
//         </div>

//         {isLoading ? (
//           <div className="text-center text-blue-700">Loading...</div>
//         ) : feeStructure.length === 0 ? (
//           <div className="text-gray-500">No fee structure found.</div>
//         ) : (
//           <div className="space-y-4 max-h-[500px] overflow-y-auto">
//             {feeStructure.map((item, idx) => (
//               <div key={idx} className="bg-white border rounded p-4 shadow-sm">
//                 <p className="font-semibold text-blue-800">{item.fee_field_name}</p>
//                 <p className="text-sm text-gray-700">Amount: ₹{item.amount}</p>
//                 <p
//                   className={`text-sm font-medium ${
//                     item.is_collectable ? 'text-green-600' : 'text-red-500'
//                   }`}
//                 >
//                   {item.is_collectable ? 'Collectable' : 'Not Collectable'}
//                 </p>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </DashboardLayout>
//   );
// }
'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';

interface ClassItem {
  id: string;
  name: string;
}

interface FeeStructureItem {
  fee_field_name: string;
  amount: string;
  is_collectable: boolean;
}

export default function ViewFeeStructurePage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [token, setToken] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [feeStructure, setFeeStructure] = useState<FeeStructureItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const tk = localStorage.getItem('token');
    if (!tk) return;
    setToken(tk);
    fetchClasses(tk);
  }, []);

  const fetchClasses = async (tk: string) => {
    try {
      const res = await fetch(`${baseUrl}/api/classes`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tk}`,
        },
      });

      if (!res.ok) throw new Error('Failed to load classes');
      const data = await res.json();

      const uniqueClasses: { [coreName: string]: ClassItem } = {};
      for (const item of data) {
        const id = item.id?.toString() ?? item._id?.toString() ?? '';
        const fullName = item.class_name?.toString() ?? '';
        
        // Extract core class name (e.g., "Class 1" from "Class 1 Section A")
        const coreNameMatch = fullName.match(/^Class\s*\d+/i);
        const coreName = coreNameMatch ? coreNameMatch[0] : fullName;

        if (!uniqueClasses[coreName]) {
          uniqueClasses[coreName] = { id, name: coreName };
        }
      }

      setClasses(Object.values(uniqueClasses));
    } catch (err) {
      console.error('❌ Error fetching classes:', err);
      setError('Failed to load classes');
    }
  };

  const fetchFeeStructure = async (classId: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/feestructure/${classId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch fee structure');
      const data = await res.json();

      const parsed: FeeStructureItem[] = (data.data || []).map((item: any) => ({
        fee_field_name: item.fee_field_name ?? 'Unknown Fee',
        amount: item.amount?.toString() ?? '0',
        is_collectable: item.is_collectable ?? true,
      }));

      setFeeStructure(parsed);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching fee structure:', err);
      setError('Failed to fetch fee structure');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClassFeeStructure = async () => {
    if (!selectedClassId) return alert('Please select a class first.');
  
    const confirmDelete = confirm('Are you sure you want to delete the fee structure for this class? This action cannot be undone.');
    if (!confirmDelete) return;
  
    try {
      setIsDeleting(true);
      const response = await fetch(`${baseUrl}/api/feestructure/${selectedClassId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const result = await response.json();
  
      if (response.ok) {
        setFeeStructure([]);
        setSuccess(result.message);
        setError(null);
        alert(result.message);
      } else {
        setError(result.message || 'Failed to delete fee structure');
      }
    } catch (err) {
      console.error('❌ Error deleting class fee structure:', err);
      setError('Error deleting class fee structure');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedClassId(value);
    if (value) {
      fetchFeeStructure(value);
    } else {
      setFeeStructure([]);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-900 mb-6">View Fee Structure</h1>

        <div className="mb-6">
          <label className="block font-medium mb-2 text-gray-700">Select Class</label>
          <select
            value={selectedClassId}
            onChange={handleClassChange}
            className="w-full border text-gray-700 border-gray-300 rounded px-3 py-2"
          >
            <option value="">-- Select Class --</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

        {isLoading ? (
          <div className="text-center text-blue-700">Loading...</div>
        ) : feeStructure.length === 0 ? (
          <div className="text-gray-500">No fee structure found.</div>
        ) : (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={deleteClassFeeStructure}
                disabled={isDeleting}
                className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                title="Delete all fee structures"
              >
                {isDeleting ? (
                  <span className="text-xs">Deleting...</span>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                )}
              </button>
            </div>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {feeStructure.map((item, idx) => (
                <div key={idx} className="bg-white border rounded p-4 shadow-sm">
                  <p className="font-semibold text-blue-800">{item.fee_field_name}</p>
                  <p className="text-sm text-gray-700">Amount: ₹{item.amount}</p>
                  <p
                    className={`text-sm font-medium ${
                      item.is_collectable ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {item.is_collectable ? 'Collectable' : 'Not Collectable'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}