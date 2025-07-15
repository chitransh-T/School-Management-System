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

//       const uniqueClasses: { [name: string]: ClassItem } = {};
//       for (const item of data) {
//         const id = item.id?.toString() ?? item._id?.toString() ?? '';
//         const name = item.class_name?.toString() ?? '';
//         if (!uniqueClasses[name]) {
//           uniqueClasses[name] = { id, name };
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
        // Adjust this regex based on your class name format
        const coreNameMatch = fullName.match(/^Class\s*\d+/i);
        const coreName = coreNameMatch ? coreNameMatch[0] : fullName;

        if (!uniqueClasses[coreName]) {
          uniqueClasses[coreName] = { id, name: coreName }; // Store core name for display
        }
      }

      setClasses(Object.values(uniqueClasses));
    } catch (err) {
      console.error('❌ Error fetching classes:', err);
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
    } catch (err) {
      console.error('❌ Error fetching fee structure:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedClassId(value);
    fetchFeeStructure(value);
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

        {isLoading ? (
          <div className="text-center text-blue-700">Loading...</div>
        ) : feeStructure.length === 0 ? (
          <div className="text-gray-500">No fee structure found.</div>
        ) : (
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
        )}
      </div>
    </DashboardLayout>
  );
}
