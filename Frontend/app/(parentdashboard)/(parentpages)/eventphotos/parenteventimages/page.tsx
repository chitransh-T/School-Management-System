

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { useAuth } from '@/app/context/AuthContext';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

interface EventImage {
  id: number;
  title: string;
  image_url: string;
  created_at: string;
}

export default function EventGalleryPage() {
  const { user } = useAuth();
  const [images, setImages] = useState<EventImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<EventImage | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string | null>('All Images');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [uniqueTitles, setUniqueTitles] = useState<string[]>([]);
  const [uniqueDates, setUniqueDates] = useState<string[]>([]);

  useEffect(() => {
    fetchEventImages();
  }, []);

  const fetchEventImages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/api/parent/event-images`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch images');
      const imageData = data.data.map((img: any) => ({
        ...img,
        image_url: `${baseUrl}${img.image_url}`,
      }));

      setImages(imageData);
      // Generate unique titles and dates
      const titles = new Set(imageData.map((img: EventImage) => img.title));
      const dates = new Set<string>(
        imageData.map((img: EventImage) => {
          const date = new Date(img.created_at);
          return isNaN(date.getTime())
            ? 'Unknown Date'
            : date.toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
              });
        })
      );

      setUniqueTitles(['All Images', ...Array.from(titles) as string[]]);
      setUniqueDates(['All Dates', ...Array.from(dates) as string[]]);

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Unable to load event images');
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/api/delete-event-image/${imageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Delete failed');
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err: any) {
      alert(err.message || 'Could not delete image');
    }
  };

  const handleDownload = async (imageUrl: string, title: string) => {
    try {
      const response = await fetch(imageUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Image fetch failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download image.');
      console.error('Download error:', error);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : null;
    setSelectedDate(newDate);
    setSelectedFilter('All Images');
  };

  const getFilteredImages = () => {
    let filteredImages = images;

    if (selectedDate) {
      filteredImages = filteredImages.filter((image) => {
        try {
          const imageDate = new Date(image.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          });
          const selectedDateStr = selectedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          });
          return imageDate === selectedDateStr;
        } catch (e) {
          return false;
        }
      });
    }

    if (selectedFilter && selectedFilter !== 'All Images') {
      filteredImages = filteredImages.filter((image) => image.title === selectedFilter);
    }

    return filteredImages;
  };

  const getTitlesForSelectedDate = () => {
    if (!selectedDate) return uniqueTitles;

    const titles = new Set(
      images
        .filter((image) => {
          try {
            const imageDate = new Date(image.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            });
            const selectedDateStr = selectedDate.toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            });
            return imageDate === selectedDateStr;
          } catch (e) {
            return false;
          }
        })
        .map((image) => image.title)
    );

    return ['All Images', ...Array.from(titles)];
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6 text-blue-900">Event Gallery</h1>

        {/* Filters with proper alignment */}
        <div className="mb-6 flex items-end gap-4">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* Title Filter */}
            <div>
              <label htmlFor="event-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Event
              </label>
              <select
                id="event-filter"
                value={selectedFilter || 'All Images'}
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

        {error && <div className="text-red-600 mb-4">{error}</div>}

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
                onClick={() => setSelectedImage(img)}
              >
                <p className="text-center text-blue-800 font-medium mb-2 truncate">{img.title}</p>
                <div className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden shadow hover:shadow-lg transition-shadow duration-200">
                  <Image
                    src={img.image_url}
                    alt={img.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
                  {/* Download Icon on Hover */}
                  <button
                    className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(img.image_url, img.title);
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
                  {/* Delete Button (if user is authorized, e.g., teacher or principal) */}
                  {user?.role === 'teacher' || user?.role === 'principal' ? (
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
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full-screen Image View */}
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
                src={selectedImage.image_url}
                alt={selectedImage.title}
                width={1000}
                height={700}
                className="object-contain max-h-full max-w-full"
                style={{ maxWidth: '90vw', maxHeight: '90vh' }}
              />
            </div>
            <button
              className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-colors duration-200"
              onClick={() => handleDownload(selectedImage.image_url, selectedImage.title)}
              title="Download"
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
        )}
      </div>
    </DashboardLayout>
  );
}