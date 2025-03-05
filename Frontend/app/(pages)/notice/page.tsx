"use client"
import React, { useState } from 'react';
import Sidebar from '@/app/dashboardComponents/sidebar';
import { useRouter } from 'next/navigation';
import { Bell, Plus, Trash2 } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

const NoticePage = () => {
  const router = useRouter();
  // Adding dummy data instead of fetching from API
  const [notices, setNotices] = useState<Notice[]>([
    {
      id: '1',
      title: 'School Annual Day Celebration',
      content: 'Annual day celebration will be held on 15th December 2024. All students and teachers must attend.',
      date: '2024-03-20',
      category: 'Event',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Parent-Teacher Meeting',
      content: 'Parent-teacher meeting is scheduled for next week. Please prepare your reports.',
      date: '2024-03-25',
      category: 'Meeting',
      priority: 'medium'
    }
    
  ]);

  const handleAddNotice = () => {
    router.push('/addnotice');
  };

  const handleDelete = (id: string) => {
    setNotices(notices.filter(notice => notice.id !== id));
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8 bg-gray-100 my-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
            <button
              onClick={handleAddNotice}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add New Notice
            </button>
          </div>

          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">{notice.title}</h2>
                    <p className="text-gray-900 mb-4">{notice.content}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-900">{notice.date}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-gray-900">
                        {notice.category}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        notice.priority === 'high' 
                          ? 'bg-red-100 text-red-800'
                          : notice.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {notice.priority}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-gray-900" />
                    <button
                      onClick={() => handleDelete(notice.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticePage;