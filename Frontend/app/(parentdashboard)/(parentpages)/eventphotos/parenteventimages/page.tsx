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
}

export default function EventGalleryPage() {
  const { user } = useAuth();
  const [images, setImages] = useState<EventImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<EventImage | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEventImages();
  }, []);

  const fetchEventImages = async () => {
    try {
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
    } catch (err: any) {
      setError(err.message || 'Unable to load event images');
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/api/event-images/${imageId}`, {
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
          // Add any auth headers if required
          // Authorization: `Bearer ${localStorage.getItem('token')}`,
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

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6 text-blue-900">Event Gallery</h1>

        {error && <div className="text-red-600 mb-4">{error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group cursor-pointer"
              onClick={() => setSelectedImage(img)}
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

                {/* Hover buttons */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                 
                  <button
                    className="bg-blue-600 text-white rounded-full p-1 text-sm"
                    title="Download"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(img.image_url, img.title);
                    }}
                  >
                    ⬇
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Full-screen Image View */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
            <button
              className="absolute top-4 right-4 text-white text-4xl font-bold"
              onClick={() => setSelectedImage(null)}
            >
              &times;
            </button>
            <Image
              src={selectedImage.image_url}
              alt={selectedImage.title}
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

