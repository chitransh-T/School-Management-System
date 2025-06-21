

'use client'
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FiSearch, FiUsers, FiFilter, FiArrowRight, FiBook } from 'react-icons/fi';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';

type ClassModel = {
  id: string;
  name: string;
  sections: string[];
};

type StudentModel = {
  id: string;
  name: string;
  classId: string;
  className: string;
  section: string;
};

type FeeStructureModel = {
  feeMasterId: string;
  feeFieldName: string;
  amount: string;
  isCollectable: boolean;
  isMandatory: boolean;
  isMonthly: boolean;
  isOneTime: boolean;
};

export default function FeeCollectPage() {
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [students, setStudents] = useState<StudentModel[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentModel[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedClassName, setSelectedClassName] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const classIdCache: Record<string, string> = {};
  const feeStructureCache: Record<string, FeeStructureModel[]> = {};

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);
      if (storedToken) {
        await fetchClasses(storedToken);
      }
    };
    loadToken();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchQuery, selectedSection, students]);

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 3000);
  };

  const fetchClasses = async (authToken: string) => {
    try {
      setIsLoadingClasses(true);
      const response = await axios.get(`${baseUrl}/api/classes`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': authToken,
        },
      });

      if (response.status === 200) {
        const classData = response.data;
        const classMap: Record<string, ClassModel> = {};

        for (const data of classData) {
          const rawClassName = (data['class_name'] ?? data['className'] ?? '').toString().trim();
          if (rawClassName === '') continue;

          const classId = data['id']?.toString() ?? data['class_id']?.toString() ?? '';
          const section = (data['section'] ?? '').toString().trim();

          if (classMap[rawClassName]) {
            if (section !== '' && !classMap[rawClassName].sections.includes(section)) {
              classMap[rawClassName].sections.push(section);
            }
          } else {
            classMap[rawClassName] = {
              id: classId,
              name: rawClassName,
              sections: section !== '' ? [section] : [],
            };
            classIdCache[rawClassName] = classId;
          }
        }

        for (const classObj of Object.values(classMap)) {
          classObj.sections.sort();
        }

        const classesList = Object.values(classMap).sort((a, b) => a.name.localeCompare(b.name));
        setClasses(classesList);
      } else {
        showError(`Failed to load classes: ${response.status}`);
      }
    } catch (error) {
      showError(`Error loading classes: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const updateAvailableSections = (className: string | null) => {
    if (className !== null) {
      const selectedClass = classes.find(c => c.name === className) || {
        id: '',
        name: '',
        sections: [],
      };
      setSelectedClassId(selectedClass.id);
      setAvailableSections(selectedClass.sections);
      setSelectedClassName(selectedClass.name);
    } else {
      setSelectedClassId(null);
      setAvailableSections([]);
      setSelectedClassName(null);
    }
    setSelectedSection(null);
    setStudents([]);
    setFilteredStudents([]);
    if (className !== null) {
      fetchStudents(className);
    }
  };

  const fetchStudents = async (className: string) => {
    if (!token) return;

    setIsLoadingStudents(true);
    setFilteredStudents([]);

    try {
      const encodedClassName = encodeURIComponent(className);
      const response = await axios.get(`${baseUrl}/api/students/${encodedClassName}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token,
        },
      });

      if (response.status === 200) {
        const studentData = response.data;
        const newStudents = studentData
          .map((data: any) => ({
            id: data['_id']?.toString() ?? data['id']?.toString() ?? '',
            name: data['student_name']?.toString() ?? 'Unknown Student',
            classId: selectedClassId ?? '',
            className: className,
            section: data['assigned_section']?.toString() ?? '',
          }))
          .filter((student: StudentModel) => student.id !== '');

        setStudents(newStudents);
      } else {
        showError(`Failed to load students: ${response.statusText}`);
      }
    } catch (error) {
      showError(`Error loading students: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const filterStudents = useCallback(() => {
    const searchText = searchQuery.toLowerCase();
    const filtered = students.filter(student => {
      const nameMatch = student.name.toLowerCase().includes(searchText);
      const sectionMatch = selectedSection === null || student.section === selectedSection;
      return nameMatch && sectionMatch;
    });
    setFilteredStudents(filtered);
  }, [searchQuery, selectedSection, students]);

  const fetchStudentFeeData = async (student: StudentModel) => {
    const classId = classIdCache[student.className] || await getClassId(student.className);
    const feeStructure = feeStructureCache[student.className] || await getFeeStructure(classId);
    const paidFeeMasterIds = await getPaidFees(student.id);
    const previousBalance = await getPreviousBalance(student.id);

    let totalYearlyFee = 0.0;
    for (const fee of feeStructure) {
      if (!paidFeeMasterIds.includes(fee.feeMasterId.toString()) || !fee.isOneTime) {
        const amount = parseFloat(fee.amount) || 0.0;
        totalYearlyFee += fee.isMonthly ? amount : amount;
      }
    }

    return {
      classId,
      feeStructure,
      paidFeeMasterIds,
      previousBalance,
      totalYearlyFee,
    };
  };

  const getClassId = async (className: string) => {
    if (classIdCache[className]) return classIdCache[className];

    try {
      const response = await axios.get(`${baseUrl}/api/classes`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token || '',
        },
      });

      if (response.status === 200) {
        const classData = response.data;
        for (const data of classData) {
          const name = (data['class_name'] ?? data['className'] ?? '').toString().trim();
          if (name.toLowerCase() === className.toLowerCase()) {
            const id = data['id']?.toString() ?? data['class_id']?.toString();
            if (id) {
              classIdCache[className] = id;
              return id;
            }
          }
        }
      }
    } catch (error) {
      showError(`Error fetching class ID: ${error instanceof Error ? error.message : String(error)}`);
    }
    classIdCache[className] = className;
    return className;
  };

  const getFeeStructure = async (classId: string) => {
    if (feeStructureCache[classId]) return feeStructureCache[classId];

    try {
      const response = await axios.get(`${baseUrl}/api/feestructure/${classId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token || '',
        },
      });

      if (response.status === 200) {
        const feeStructureData = response.data;
        const feeStructureList = Array.isArray(feeStructureData)
          ? feeStructureData
          : feeStructureData['data'] || [];
        const feeStructure: FeeStructureModel[] = feeStructureList.map((item: any) => ({
          feeMasterId: item.feeMasterId?.toString() || item.fee_master_id?.toString() || '',
          feeFieldName: item.feeFieldName?.toString() || item.fee_field_name?.toString() || 'Unknown Fee',
          amount: item.amount?.toString() || '0',
          isCollectable: item.isCollectable || item.is_collectable || false,
          isMandatory: item.isMandatory || item.is_mandatory || false,
          isMonthly: Boolean(item.isMonthly || item.is_monthly || item.feeFieldName?.toLowerCase().includes('tution') || item.feeFieldName?.toLowerCase().includes('monthly')),
          isOneTime: Boolean(item.isOneTime || item.is_one_time),
        }));
        feeStructureCache[classId] = feeStructure;
        return feeStructure;
      }
    } catch (error) {
      showError(`Error fetching fee structure: ${error instanceof Error ? error.message : String(error)}`);
    }
    return [];
  };

  const getPaidFees = async (studentId: string) => {
    try {
      const response = await axios.get(`${baseUrl}/api/fees/paid?studentId=${studentId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token || '',
        },
      });

      if (response.status === 200) {
        return response.data as string[];
      }
    } catch (error) {
      showError(`Error fetching paid fees: ${error instanceof Error ? error.message : String(error)}`);
    }
    return [];
  };

  const getPreviousBalance = async (studentId: string) => {
    try {
      const response = await axios.get(`${baseUrl}/api/summary/${studentId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token || '',
        },
      });

      if (response.status === 200) {
        const balanceData = response.data;
        return parseFloat(balanceData['data']['last_due_balance'] || 0);
      }
    } catch (error) {
      showError(`Error fetching previous balance: ${error instanceof Error ? error.message : String(error)}`);
    }
    return 0;
  };

  const handleStudentClick = async (student: StudentModel) => {
    setIsLoadingStudents(true);
    try {
      const feeData = await fetchStudentFeeData(student);
      router.push(`/feesdetailsofstudent/${student.id}?data=${encodeURIComponent(JSON.stringify({
        studentId: student.id,
        studentName: student.name,
        studentClass: student.className,
        studentSection: student.section,
        isNewAdmission: false,
        preloadedData: feeData,
      }))}`);
    } catch (error) {
      showError(`Error navigating to fee details: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-blue-900 text-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-center">Collect Fee</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-800 text-white rounded-lg shadow-md">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-4">Filter Students</h2>
              
              {isLoadingClasses ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-900"></div>
                </div>
              ) : classes.length === 0 ? (
                <div className="text-center text-gray-600 py-4">No classes available</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-1">Select Class</label>
                    <select
                      className="w-full p-3 border border-blue-100 rounded-lg text-gray-700 bg-blue-50 focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                      value={selectedClassName || ''}
                      onChange={(e) => updateAvailableSections(e.target.value || null)}
                    >
                      <option value="">-- Select a Class --</option>
                      {classes.map((classItem) => (
                        <option key={classItem.id} value={classItem.name}>
                          {classItem.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedClassName && availableSections.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">Select Section</label>
                      <select
                        className="w-full p-3 border border-blue-100 rounded-lg text-gray-700 bg-blue-50 focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                        value={selectedSection || ''}
                        onChange={(e) => setSelectedSection(e.target.value || null)}
                      >
                        <option value="">-- All Sections --</option>
                        {availableSections.map((section) => (
                          <option key={section} value={section}>
                            {section}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {selectedClassName && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-blue-900" />
                </div>
                <input
                  type="text"
                  className="w-full py-3 pl-10 pr-4 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                  placeholder="Search Student"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {selectedClassName && (
            <div>
              <h2 className="text-lg font-bold text-blue-900 mb-4">Students</h2>
              
              {isLoadingStudents ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-900"></div>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    {selectedSection === null ? (
                      <>
                        <FiUsers className="text-blue-900 text-4xl mb-4" />
                        <p className="text-gray-600">No students found in this class</p>
                      </>
                    ) : (
                      <>
                        <FiFilter className="text-blue-900 text-4xl mb-4" />
                        <p className="text-gray-600">No students found in this section</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleStudentClick(student)}
                    >
                      <div className="p-4 flex items-center">
                        <div className="bg-blue-50 rounded-full p-3 mr-4">
                          <FiUsers className="text-blue-900" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900">{student.name}</h3>
                          <p className="text-sm text-gray-600">
                            Class: {student.className} • Section: {student.section}
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded-full p-2">
                          <FiArrowRight className="text-blue-900" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!selectedClassName && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden py-16 text-center">
              <div className="flex flex-col items-center justify-center">
                <FiBook className="text-blue-900 text-4xl mb-4" />
                <p className="text-gray-600">Please select a class to view students</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}

// 'use client'
// import { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import axios from 'axios';
// import { FiSearch, FiUsers, FiFilter, FiArrowRight, FiBook } from 'react-icons/fi';
// import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';

// type ClassModel = {
//   id: string;
//   name: string;
//   sections: string[];
// };

// type StudentModel = {
//   id: string;
//   name: string;
//   classId: string;
//   className: string;
//   section: string;
// };

// type FeeStructureModel = {
//   feeMasterId: string;
//   feeFieldName: string;
//   amount: string;
//   isCollectable: boolean;
//   isMandatory: boolean;
//   isMonthly: boolean;
//   isOneTime: boolean;
// };

// export default function FeeCollectPage() {
//   const [classes, setClasses] = useState<ClassModel[]>([]);
//   const [students, setStudents] = useState<StudentModel[]>([]);
//   const [filteredStudents, setFilteredStudents] = useState<StudentModel[]>([]);
//   const [isLoadingClasses, setIsLoadingClasses] = useState(true);
//   const [isLoadingStudents, setIsLoadingStudents] = useState(false);
//   const [token, setToken] = useState<string | null>(null);
//   const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
//   const [selectedClassName, setSelectedClassName] = useState<string | null>(null);
//   const [selectedSection, setSelectedSection] = useState<string | null>(null);
//   const [availableSections, setAvailableSections] = useState<string[]>([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [error, setError] = useState<string | null>(null);
//   const router = useRouter();

//   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
//   const classIdCache: Record<string, string> = {};
//   const feeStructureCache: Record<string, FeeStructureModel[]> = {};

//   useEffect(() => {
//     const loadToken = async () => {
//       const storedToken = localStorage.getItem('token');
//       setToken(storedToken);
//       if (storedToken) {
//         await fetchClasses(storedToken);
//       }
//     };
//     loadToken();
//   }, []);

//   useEffect(() => {
//     filterStudents();
//   }, [searchQuery, selectedSection, students]);

//   const showError = (message: string) => {
//     setError(message);
//     setTimeout(() => setError(null), 3000);
//   };

//   const fetchClasses = async (authToken: string) => {
//     try {
//       setIsLoadingClasses(true);
//       const response = await axios.get(`${baseUrl}/api/classes`, {
//         headers: {
//           'Accept': 'application/json',
//           'Content-Type': 'application/json',
//           'Authorization': authToken,
//         },
//       });

//       if (response.status === 200) {
//         const classData = response.data;
//         const classMap: Record<string, ClassModel> = {};

//         for (const data of classData) {
//           const rawClassName = (data['class_name'] ?? data['className'] ?? '').toString().trim();
//           if (rawClassName === '') continue;

//           const classId = data['id']?.toString() ?? data['class_id']?.toString() ?? '';
//           const section = (data['section'] ?? '').toString().trim();

//           if (classMap[rawClassName]) {
//             if (section !== '' && !classMap[rawClassName].sections.includes(section)) {
//               classMap[rawClassName].sections.push(section);
//             }
//           } else {
//             classMap[rawClassName] = {
//               id: classId,
//               name: rawClassName,
//               sections: section !== '' ? [section] : [],
//             };
//             classIdCache[rawClassName] = classId;
//           }
//         }

//         for (const classObj of Object.values(classMap)) {
//           classObj.sections.sort();
//         }

//         const classesList = Object.values(classMap).sort((a, b) => a.name.localeCompare(b.name));
//         setClasses(classesList);
//       } else {
//         showError(`Failed to load classes: ${response.status}`);
//       }
//     } catch (error) {
//       showError(`Error loading classes: ${error instanceof Error ? error.message : String(error)}`);
//     } finally {
//       setIsLoadingClasses(false);
//     }
//   };

//   const updateAvailableSections = (className: string | null) => {
//     if (className !== null) {
//       const selectedClass = classes.find(c => c.name === className) || {
//         id: '',
//         name: '',
//         sections: [],
//       };
//       setSelectedClassId(selectedClass.id);
//       setAvailableSections(selectedClass.sections);
//       setSelectedClassName(selectedClass.name);
//     } else {
//       setSelectedClassId(null);
//       setAvailableSections([]);
//       setSelectedClassName(null);
//     }
//     setSelectedSection(null);
//     setStudents([]);
//     setFilteredStudents([]);
//     if (className !== null) {
//       fetchStudents(className);
//     }
//   };

//   const fetchStudents = async (className: string) => {
//     if (!token) return;

//     setIsLoadingStudents(true);
//     setFilteredStudents([]);

//     try {
//       const encodedClassName = encodeURIComponent(className);
//       const response = await axios.get(`${baseUrl}/api/students/${encodedClassName}`, {
//         headers: {
//           'Accept': 'application/json',
//           'Content-Type': 'application/json',
//           'Authorization': token,
//         },
//       });

//       if (response.status === 200) {
//         const studentData = response.data;
//         const newStudents = studentData
//           .map((data: any) => ({
//             id: data['_id']?.toString() ?? data['id']?.toString() ?? '',
//             name: data['student_name']?.toString() ?? 'Unknown Student',
//             classId: selectedClassId ?? '',
//             className: className,
//             section: data['assigned_section']?.toString() ?? '',
//           }))
//           .filter((student: StudentModel) => student.id !== '');

//         setStudents(newStudents);
//       } else {
//         showError(`Failed to load students: ${response.statusText}`);
//       }
//     } catch (error) {
//       showError(`Error loading students: ${error instanceof Error ? error.message : String(error)}`);
//     } finally {
//       setIsLoadingStudents(false);
//     }
//   };

//   const filterStudents = useCallback(() => {
//     const searchText = searchQuery.toLowerCase();
//     const filtered = students.filter(student => {
//       const nameMatch = student.name.toLowerCase().includes(searchText);
//       const sectionMatch = selectedSection === null || student.section === selectedSection;
//       return nameMatch && sectionMatch;
//     });
//     setFilteredStudents(filtered);
//   }, [searchQuery, selectedSection, students]);

//   const fetchStudentFeeData = async (student: StudentModel) => {
//     const classId = classIdCache[student.className] || await getClassId(student.className);
//     const feeStructure = feeStructureCache[student.className] || await getFeeStructure(classId);
//     const paidFeeMasterIds = await getPaidFees(student.id);
//     const previousBalance = await getPreviousBalance(student.id);

//     let totalYearlyFee = 0.0;
//     for (const fee of feeStructure) {
//       if (!paidFeeMasterIds.includes(fee.feeMasterId.toString()) || !fee.isOneTime) {
//         const amount = parseFloat(fee.amount) || 0.0;
//         totalYearlyFee += fee.isMonthly ? amount : amount;
//       }
//     }

//     return {
//       classId,
//       feeStructure,
//       paidFeeMasterIds,
//       previousBalance,
//       totalYearlyFee,
//     };
//   };

//   const getClassId = async (className: string) => {
//     if (classIdCache[className]) return classIdCache[className];

//     try {
//       const response = await axios.get(`${baseUrl}/api/classes`, {
//         headers: {
//           'Accept': 'application/json',
//           'Content-Type': 'application/json',
//           'Authorization': token || '',
//         },
//       });

//       if (response.status === 200) {
//         const classData = response.data;
//         for (const data of classData) {
//           const name = (data['class_name'] ?? data['className'] ?? '').toString().trim();
//           if (name.toLowerCase() === className.toLowerCase()) {
//             const id = data['id']?.toString() ?? data['class_id']?.toString();
//             if (id) {
//               classIdCache[className] = id;
//               return id;
//             }
//           }
//         }
//       }
//     } catch (error) {
//       showError(`Error fetching class ID: ${error instanceof Error ? error.message : String(error)}`);
//     }
//     classIdCache[className] = className;
//     return className;
//   };

//   const getFeeStructure = async (classId: string) => {
//     if (feeStructureCache[classId]) return feeStructureCache[classId];

//     try {
//       const response = await axios.get(`${baseUrl}/api/feestructure/${classId}`, {
//         headers: {
//           'Accept': 'application/json',
//           'Content-Type': 'application/json',
//           'Authorization': token || '',
//         },
//       });

//       if (response.status === 200) {
//         const feeStructureData = response.data;
//         const feeStructureList = Array.isArray(feeStructureData)
//           ? feeStructureData
//           : feeStructureData['data'] || [];
//         const feeStructure: FeeStructureModel[] = feeStructureList.map((item: any) => ({
//           feeMasterId: item.feeMasterId?.toString() || item.fee_master_id?.toString() || '',
//           feeFieldName: item.feeFieldName?.toString() || item.fee_field_name?.toString() || 'Unknown Fee',
//           amount: item.amount?.toString() || '0',
//           isCollectable: item.isCollectable || item.is_collectable || false,
//           isMandatory: item.isMandatory || item.is_mandatory || false,
//           isMonthly: Boolean(item.isMonthly || item.is_monthly || item.feeFieldName?.toLowerCase().includes('tution') || item.feeFieldName?.toLowerCase().includes('monthly')),
//           isOneTime: Boolean(item.isOneTime || item.is_one_time),
//         }));
//         feeStructureCache[classId] = feeStructure;
//         return feeStructure;
//       }
//     } catch (error) {
//       showError(`Error fetching fee structure: ${error instanceof Error ? error.message : String(error)}`);
//     }
//     return [];
//   };

//   const getPaidFees = async (studentId: string) => {
//     try {
//       const response = await axios.get(`${baseUrl}/api/fees/paid?studentId=${studentId}`, {
//         headers: {
//           'Accept': 'application/json',
//           'Content-Type': 'application/json',
//           'Authorization': token || '',
//         },
//       });

//       if (response.status === 200) {
//         return response.data as string[];
//       }
//     } catch (error) {
//       showError(`Error fetching paid fees: ${error instanceof Error ? error.message : String(error)}`);
//     }
//     return [];
//   };

//   const getPreviousBalance = async (studentId: string) => {
//     try {
//       const response = await axios.get(`${baseUrl}/api/summary/${studentId}`, {
//         headers: {
//           'Accept': 'application/json',
//           'Content-Type': 'application/json',
//           'Authorization': token || '',
//         },
//       });

//       if (response.status === 200) {
//         const balanceData = response.data;
//         return parseFloat(balanceData['data']['last_due_balance'] || 0);
//       }
//     } catch (error) {
//       showError(`Error fetching previous balance: ${error instanceof Error ? error.message : String(error)}`);
//     }
//     return 0;
//   };

//   const handleStudentClick = async (student: StudentModel) => {
//     setIsLoadingStudents(true);
//     try {
//       const feeData = await fetchStudentFeeData(student);
//       router.push(`/feesdetailsofstudent/${student.id}?data=${encodeURIComponent(JSON.stringify({
//         studentId: student.id,
//         studentName: student.name,
//         studentClass: student.className,
//         studentSection: student.section,
//         isNewAdmission: false,
//         preloadedData: feeData,
//       }))}`);
//     } catch (error) {
//       showError(`Error navigating to fee details: ${error instanceof Error ? error.message : String(error)}`);
//     } finally {
//       setIsLoadingStudents(false);
//     }
//   };

//   return (
//     <DashboardLayout>
//       <div className="min-h-screen bg-gray-100">
//         <header className="bg-blue-900 text-white shadow-md">
//           <div className="container mx-auto px-4 py-4">
//             <h1 className="text-xl font-bold text-center">Collect Fee</h1>
//           </div>
//         </header>

//         <main className="container mx-auto px-4 py-6">
//           {error && (
//             <div className="mb-6 p-4 bg-red-800 text-white rounded-lg shadow-md">
//               {error}
//             </div>
//           )}

//           <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
//             <div className="p-6">
//               <h2 className="text-lg font-bold text-blue-900 mb-4">Filter Students</h2>
              
//               {isLoadingClasses ? (
//                 <div className="flex justify-center py-4">
//                   <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-900"></div>
//                 </div>
//               ) : classes.length === 0 ? (
//                 <div className="text-center text-gray-600 py-4">No classes available</div>
//               ) : (
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium text-blue-900 mb-1">Select Class</label>
//                     <select
//                       className="w-full p-3 border border-blue-100 rounded-lg bg-blue-50 focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
//                       value={selectedClassName || ''}
//                       onChange={(e) => updateAvailableSections(e.target.value || null)}
//                     >
//                       <option value="">-- Select a Class --</option>
//                       {classes.map((classItem) => (
//                         <option key={classItem.id} value={classItem.name}>
//                           {classItem.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   {selectedClassName && availableSections.length > 0 && (
//                     <div>
//                       <label className="block text-sm font-medium text-blue-900 mb-1">Select Section</label>
//                       <select
//                         className="w-full p-3 border border-blue-100 rounded-lg bg-blue-50 focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
//                         value={selectedSection || ''}
//                         onChange={(e) => setSelectedSection(e.target.value || null)}
//                       >
//                         <option value="">-- All Sections --</option>
//                         {availableSections.map((section) => (
//                           <option key={section} value={section}>
//                             {section}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>

//           {selectedClassName && (
//             <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <FiSearch className="text-blue-900" />
//                 </div>
//                 <input
//                   type="text"
//                   className="w-full py-3 pl-10 pr-4 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
//                   placeholder="Search Student"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                 />
//               </div>
//             </div>
//           )}

//           {selectedClassName && (
//             <div>
//               <h2 className="text-lg font-bold text-blue-900 mb-4">Students</h2>
              
//               {isLoadingStudents ? (
//                 <div className="flex justify-center py-8">
//                   <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-900"></div>
//                 </div>
//               ) : filteredStudents.length === 0 ? (
//                 <div className="bg-white rounded-xl shadow-md overflow-hidden py-12 text-center">
//                   <div className="flex flex-col items-center justify-center">
//                     {selectedSection === null ? (
//                       <>
//                         <FiUsers className="text-blue-900 text-4xl mb-4" />
//                         <p className="text-gray-600">No students found in this class</p>
//                       </>
//                     ) : (
//                       <>
//                         <FiFilter className="text-blue-900 text-4xl mb-4" />
//                         <p className="text-gray-600">No students found in this section</p>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-3">
//                   {filteredStudents.map((student) => (
//                     <div
//                       key={student.id}
//                       className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
//                       onClick={() => handleStudentClick(student)}
//                     >
//                       <div className="p-4 flex items-center">
//                         <div className="bg-blue-50 rounded-full p-3 mr-4">
//                           <FiUsers className="text-blue-900" />
//                         </div>
//                         <div className="flex-1">
//                           <h3 className="font-semibold text-blue-900">{student.name}</h3>
//                           <p className="text-sm text-gray-600">
//                             Class: {student.className} • Section: {student.section}
//                           </p>
//                         </div>
//                         <div className="bg-blue-50 rounded-full p-2">
//                           <FiArrowRight className="text-blue-900" />
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}

//           {!selectedClassName && (
//             <div className="bg-white rounded-xl shadow-md overflow-hidden py-16 text-center">
//               <div className="flex flex-col items-center justify-center">
//                 <FiBook className="text-blue-900 text-4xl mb-4" />
//                 <p className="text-gray-600">Please select a class to view students</p>
//               </div>
//             </div>
//           )}
//         </main>
//       </div>
//     </DashboardLayout>
//   );
// }