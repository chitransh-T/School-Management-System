

"use client"
import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Calendar, Tag, AlertTriangle, FileText, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';

interface Notice {
  title: string;
  content: string;
  notice_date: string;
  end_date: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

const NewNoticePage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<Notice>({
    title: '',
    content: '',
    notice_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    category: '',
    priority: 'medium'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.title.trim()) {
      setError('Please enter a notice title');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('Please enter notice content');
      return;
    }
    
    if (!formData.category) {
      setError('Please select a category');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!token) {
        setError('You must be logged in to create a notice');
        setIsSubmitting(false);
        return;
      }
      
      // Send data to backend API
      const response = await fetch(`${baseUrl}/api/notices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create notice');
      }
      
      // Show success message
      setSuccess('Notice created successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/notice');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error creating notice:', err);
      setError(err.message || 'An error occurred while creating the notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/notice');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Notice</h1>
              <p className="text-gray-600">Share important information with your community</p>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-800 px-6 py-4 rounded-r-lg mb-6 shadow-sm animate-pulse">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-3 text-red-400" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 text-green-800 px-6 py-4 rounded-r-lg mb-6 shadow-sm animate-pulse">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                <span className="font-medium">{success}</span>
              </div>
            </div>
          )}
          
          {/* Main Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <div className="flex items-center text-white">
                <FileText className="h-6 w-6 mr-3" />
                <h2 className="text-xl font-semibold">Notice Details</h2>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Title Field */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  Notice Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900 placeholder-gray-400"
                  placeholder="Enter a clear and descriptive title..."
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Content Field */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  Notice Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none"
                  placeholder="Provide detailed information about the notice..."
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Date Field */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                    Notice Date
                  </label>
                  <input
                    type="date"
                    value={formData.notice_date}
                    onChange={(e) => setFormData({ ...formData, notice_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900"
                    disabled={isSubmitting}
                  />
                </div>

                {/* End Date Field */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Category Field */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <Tag className="h-4 w-4 mr-2 text-blue-500" />
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900 bg-white"
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Holiday">🎉 Holiday</option>
                    <option value="Meeting">👥 Meeting</option>
                    <option value="Event">🎪 Event</option>
                    <option value="Exam">📝 Exam</option>
                    <option value="General">📢 General</option>
                  </select>
                </div>

                {/* Priority Field */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <AlertTriangle className="h-4 w-4 mr-2 text-blue-500" />
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'high' | 'medium' | 'low' })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900 bg-white"
                    disabled={isSubmitting}
                  >
                    <option value="low">🟢 Low Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="high">🔴 High Priority</option>
                  </select>
                </div>
              </div>

              {/* Priority Preview */}
              {formData.priority && (
                <div className="flex items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
                  <div className={`flex items-center px-4 py-2 rounded-full border ${getPriorityColor(formData.priority)}`}>
                    {getPriorityIcon(formData.priority)}
                    <span className="ml-2 font-medium capitalize">{formData.priority} Priority</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-100">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Creating Notice...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-3" />
                      Create Notice
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewNoticePage;