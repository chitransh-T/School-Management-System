

"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Plus, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import Sidebar from '@/app/dashboardComponents/sidebar';

interface Notice {
  id: string;
  title: string;
  content: string;
  notice_date: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  user_email?: string;
}

// Format date to a more readable format
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if invalid date
    }
    
    // Format as: "Jan 1, 2023"
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original string on error
  }
};

const NoticePage = () => {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState<string>('');

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!token) {
        setError('Authentication token not found. Please login again.');
        router.push('/auth/signin');
        return;
      }
      const response = await fetch(`${baseUrl}/api/notices`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please login again.');
          router.push('/auth/signin');
          return;
        }
        throw new Error(`Failed to fetch notices: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const formattedNotices = data.data.map((notice: any) => ({
          id: notice.id.toString(),
          title: notice.title,
          content: notice.content,
          notice_date: notice.notice_date,
          category: notice.category,
          priority: notice.priority || 'medium'
        }));
        setNotices(formattedNotices);
      } else {
        setNotices([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load notices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleAddNotice = () => {
    router.push('/addnotice');
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleteLoading(id);
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }
      const response = await fetch(`${baseUrl}/api/notices/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete notice');
      }
      setNotices(prevNotices => prevNotices.filter(notice => notice.id !== id));
      alert('Notice deleted successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to delete notice. Please try again.');
    } finally {
      setDeleteLoading('');
    }
  };

  const handleRefresh = () => {
    fetchNotices();
  };

  return (
    <DashboardLayout>
      <div className="flex-1 px-6 py-8 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Notices</h1>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition"
                title="Refresh notices"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              <button
                onClick={handleAddNotice}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" /> Add Notice
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">×</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-600 flex items-center gap-2">
                <RefreshCw className="animate-spin h-5 w-5" />
                <span>Loading notices...</span>
              </div>
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No notices found</p>
              <button
                onClick={handleAddNotice}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                <Plus size={20} /> Create Your First Notice
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {notices.map((notice) => (
                <div key={notice.id} className="bg-white rounded-xl shadow p-6 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800 mb-1">{notice.title}</h2>
                      <p className="text-gray-700 mb-3">{notice.content}</p>
                      <div className="flex gap-3 text-sm text-gray-600">
                        <span>{formatDate(notice.notice_date)}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">{notice.category}</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          notice.priority === 'high' ? 'bg-red-100 text-red-700' :
                          notice.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {notice.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-gray-500" />
                      <button
                        onClick={() => handleDelete(notice.id)}
                        disabled={deleteLoading === notice.id}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {deleteLoading === notice.id && (
                    <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center rounded-xl">
                      <div className="flex items-center gap-2 text-red-600">
                        <RefreshCw className="animate-spin h-4 w-4" />
                        <span className="text-sm">Deleting...</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NoticePage;