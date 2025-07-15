
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
  teacher_name?: string;
}

export default function PrincipalEventImagesPage() {
  const { user } = useAuth();
  const [images, setImages] = useState<EventImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('All Images');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [uniqueTitles, setUniqueTitles] = useState<string[]>([]);

  useEffect(() => {
    fetchPrincipalImages();
  }, []);

  const fetchPrincipalImages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/api/principal/event-images`, {
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

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/api/principal/delete-event-image/${imageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setImages(images.filter((img) => img.id !== imageId));
      alert('Image deleted successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to delete image');
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
        <h1 className="text-2xl font-semibold mb-6 text-blue-900">School Event Images</h1>

        <div className="mb-6 flex items-end gap-4">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
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
              <div key={img.id} className="relative group cursor-pointer">
                <p className="text-center text-blue-800 font-medium mb-2 truncate">
                  {img.title} {img.teacher_name ? `by ${img.teacher_name}` : ''}
                </p>
                <div
                  className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden shadow hover:shadow-lg transition-shadow duration-200"
                  onClick={() => setSelectedImage(img.image_url)}
                >
                  <Image
                    src={img.image_url}
                    alt={img.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
                  <button
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(img.id);
                    }}
                    title="Delete image"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <button
                    className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Download functionality not implemented as per request
                    }}
                    title="Download image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-center text-gray-600 text-sm mt-1">
                  {img.class_name} {img.section ? `- ${img.section}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}

        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <button
              className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 transition-colors z-10"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
            <div className="relative max-w-full max-h-full">
              <Image
                src={selectedImage}
                alt="Full View"
                width={1000}
                height={700}
                className="object-contain max-h-full max-w-full"
                style={{ maxWidth: '90vw', maxHeight: '90vh' }}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}