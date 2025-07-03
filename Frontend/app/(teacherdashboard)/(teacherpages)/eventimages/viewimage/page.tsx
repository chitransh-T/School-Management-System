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

  useEffect(() => {
    fetchTeacherImages();
  }, []);

  const fetchTeacherImages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/api/teacher/event-images`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setImages(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4 text-gray-700">Uploaded Event Images</h1>

        {loading ? (
          <div className="text-gray-600">Loading images...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : images.length === 0 ? (
          <div className="text-gray-500">No images uploaded yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative cursor-pointer group"
                onClick={() => setSelectedImage(`${baseUrl}${img.image_url}`)}
              >
                <Image
                  src={`${baseUrl}${img.image_url}`}
                  alt={img.title}
                  width={300}
                  height={200}
                  className="rounded-md object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-sm p-2 rounded-b-md">
                  <p>{img.title}</p>
                  {/* {img.class_name && (
                    <p className="text-xs">
                      {img.class_name} {img.section && `- ${img.section}`}
                    </p>
                  )} */}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fullscreen View */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
            <button
              className="absolute top-4 right-4 text-white text-3xl font-bold"
              onClick={() => setSelectedImage(null)}
            >
              &times;
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
