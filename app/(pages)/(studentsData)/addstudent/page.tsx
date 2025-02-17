"use client"
import React, { useState, useRef } from 'react';
import Sidebar from '@/app/dashboardComponents/sidebar';

const PreviewPage = () => {
  const countries = [
    "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria",
    "Bangladesh", "Belgium", "Brazil", "Canada", "China", "Colombia",
    "Denmark", "Egypt", "Finland", "France", "Germany", "Greece",
    "India", "Indonesia", "Iran", "Iraq", "Ireland", "Italy", "Japan",
    "Kenya", "Korea, South", "Malaysia", "Mexico", "Netherlands",
    "New Zealand", "Nigeria", "Norway", "Pakistan", "Philippines",
    "Poland", "Portugal", "Russia", "Saudi Arabia", "Singapore",
    "South Africa", "Spain", "Sweden", "Switzerland", "Thailand",
    "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom",
    "United States", "Vietnam"
  ];

  const classes = [
    "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
    "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"
  ];

  const [birthCertFileName, setBirthCertFileName] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');

  const birthCertInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setFileName: (name: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleRemoveBirthCert = () => {
    setBirthCertFileName('');
    if (birthCertInputRef.current) {
      birthCertInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFileName('');
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  // Required field indicator component
  const RequiredField = () => (
    <span className="text-red-500 ml-1">*</span>
  );

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gray-50 p-8 m-12">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <p className="text-3xl font-bold text-gray-900">Student Registration Portal</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-lg">
                <h2 className="text-2xl font-bold text-center text-white">New Student Registration</h2>
              </div>

              <div className="p-6">
                <p className="text-sm text-red-500 mb-4">Fields marked with an asterisk (*) are mandatory</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Student Information Section */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-700 border-b pb-2">Student Information</h3>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Student Name<RequiredField />
                      </label>
                      <input 
                        type="text"
                        required
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition duration-200 hover:border-blue-300 text-gray-900"
                        placeholder="Enter student's full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Registration Number<RequiredField />
                      </label>
                      <input 
                        type="text"
                        required
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition duration-200 hover:border-blue-300 text-gray-900"
                        placeholder="e.g., REG2024001"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Date of Birth<RequiredField />
                      </label>
                      <input 
                        type="date"
                        required
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition duration-200 hover:border-blue-300 text-gray-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Gender<RequiredField />
                      </label>
                      <select 
                        required
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition duration-200 hover:border-blue-300 text-gray-900 bg-white"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Country<RequiredField />
                      </label>
                      <select 
                        required
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition duration-200 hover:border-blue-300 text-gray-900 bg-white"
                      >
                        <option value="">Select Country</option>
                        {countries.map((country) => (
                          <option key={country} value={country.toLowerCase()}>{country}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Address<RequiredField />
                      </label>
                      <textarea 
                        required
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition duration-200 hover:border-blue-300 text-gray-900"
                        rows={3}
                        placeholder="Enter full address"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Assigned Class<RequiredField />
                      </label>
                      <select 
                        required
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition duration-200 hover:border-blue-300 text-gray-900 bg-white"
                      >
                        <option value="">Select Class</option>
                        {classes.map((className) => (
                          <option key={className} value={className.toLowerCase()}>{className}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Parent Information Section */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-700 border-b pb-2">Parent Information</h3>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Father's Name<RequiredField />
                      </label>
                      <input 
                        type="text"
                        required
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition duration-200 hover:border-blue-300 text-gray-900"
                        placeholder="Enter father's full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Mother's Name<RequiredField />
                      </label>
                      <input 
                        type="text"
                        required
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition duration-200 hover:border-blue-300 text-gray-900"
                        placeholder="Enter mother's full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Email<RequiredField />
                      </label>
                      <input 
                        type="email"
                        required
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition duration-200 hover:border-blue-300 text-gray-900"
                        placeholder="Enter parent's email"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Phone<RequiredField />
                      </label>
                      <input 
                        type="tel"
                        required
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition duration-200 hover:border-blue-300 text-gray-900"
                        placeholder="Enter contact number"
                      />
                    </div>

                    {/* Documents Section - Moved inside parent column */}
                    <h3 className="font-semibold text-lg text-gray-700 border-b pb-2 mt-6">Documents</h3>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Birth Certificate<RequiredField />
                      </label>
                      <input 
                        ref={birthCertInputRef}
                        type="file"
                        required
                        onChange={(e) => handleFileChange(e, setBirthCertFileName)}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition duration-200 hover:border-blue-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-gray-900"
                      />
                      {birthCertFileName && (
                        <div className="mt-1">
                          <p className="text-sm text-gray-500">Selected: {birthCertFileName}</p>
                          <button 
                            onClick={handleRemoveBirthCert}
                            className="text-sm text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Student Photo<RequiredField />
                      </label>
                      <input 
                        ref={photoInputRef}
                        type="file"
                        required
                        onChange={(e) => handleFileChange(e, setPhotoFileName)}
                        accept="image/*"
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition duration-200 hover:border-blue-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-gray-900"
                      />
                      {photoFileName && (
                        <div className="mt-1">
                          <p className="text-sm text-gray-500">Selected: {photoFileName}</p>
                          <button 
                            onClick={handleRemovePhoto}
                            className="text-sm text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-8">
                  <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition duration-200 font-semibold shadow-sm hover:shadow-md">
                    Register Student
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;