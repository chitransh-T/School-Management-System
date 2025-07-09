'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { useAuth } from '@/app/context/AuthContext';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

interface EventImage {
  id: number;
  title: string;
  image: string;
  class_id: number | null;
  class_name?: string;
  section?: string;
  created_at?: string;
  image_url: string;
}

export default function TeacherEventImagesPage() {
  const { user } = useAuth();
  const [images, setImages] = useState<EventImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('All Images');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [uniqueTitles, setUniqueTitles] = useState<string[]>([]);

  useEffect(() => {
    fetchTeacherImages();
  }, []);

  const fetchTeacherImages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/api/teacher/event-images`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      const fullImages = data.data.map((img: EventImage) => ({
        ...img,
        image_url: `${baseUrl}${img.image_url}`,
      }));

      setImages(fullImages);

      const titles = new Set(fullImages.map((img: EventImage) => img.title));
      setUniqueTitles(['All Images', ...Array.from(titles) as string[]]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : null;
    setSelectedDate(newDate);
    setSelectedFilter('All Images');
  };

  const getTitlesForSelectedDate = () => {
    if (!selectedDate) return uniqueTitles;

    const filtered = images.filter((img) => {
      if (!img.created_at) return false;
      const imageDate = new Date(img.created_at).toLocaleDateString('en-US');
      const selectedDateStr = selectedDate.toLocaleDateString('en-US');
      return imageDate === selectedDateStr;
    });

    const titles = new Set(filtered.map((img) => img.title));
    return ['All Images', ...Array.from(titles)];
  };

  const getFilteredImages = () => {
    let filtered = images;

    if (selectedDate) {
      const selectedDateStr = selectedDate.toLocaleDateString('en-US');
      filtered = filtered.filter((img) => {
        if (!img.created_at) return false;
        const imgDateStr = new Date(img.created_at).toLocaleDateString('en-US');
        return imgDateStr === selectedDateStr;
      });
    }

    if (selectedFilter !== 'All Images') {
      filtered = filtered.filter((img) => img.title === selectedFilter);
    }

    return filtered;
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6 text-blue-900">Uploaded Event Images</h1>

        {/* Filters with matching design */}
        <div className="mb-6 flex items-end gap-4">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* Title Filter */}
            <div>
              <label htmlFor="event-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Event
              </label>
              <select
                id="event-filter"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="w-full rounded-md border-gray-300 text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              >
                {getTitlesForSelectedDate().map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  id="date-filter"
                  value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                  onChange={handleDateChange}
                  className="w-full rounded-md border-gray-300 text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                  max={new Date().toISOString().split('T')[0]}
                  min="2020-01-01"
                />
                {selectedDate && (
                  <button
                    onClick={() => {
                      setSelectedDate(null);
                      setSelectedFilter('All Images');
                    }}
                    className="text-gray-500 hover:text-gray-700 text-xl"
                    title="Clear date filter"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Image grid */}
        {loading ? (
          <div className="text-gray-600">Loading images...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : getFilteredImages().length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-4 text-gray-600 text-lg">No images found for selected filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {getFilteredImages().map((img) => (
              <div
                key={img.id}
                className="relative group cursor-pointer"
                onClick={() => setSelectedImage(img.image_url)}
              >
                <p className="text-center text-blue-800 font-medium mb-2">{img.title}</p>
                <div className="relative">
                  <Image
                    src={img.image_url}
                    alt={img.title}
                    width={400}
                    height={250}
                    className="rounded-md object-cover shadow"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fullscreen View */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
            <button
              className="absolute top-4 right-4 text-white text-4xl font-bold"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
            <Image
              src={selectedImage}
              alt="Full View"
              width={1000}
              height={700}
              className="object-contain max-h-full max-w-full"
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
