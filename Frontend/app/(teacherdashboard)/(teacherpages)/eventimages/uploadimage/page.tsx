
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import DashboardLayout from '@/app/dashboardComponents/DashboardLayout';
import { useAuth } from '@/app/context/AuthContext';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

interface PreviewImage {
  file: File;
  previewUrl: string;
}

export default function EventImageUploadPage() {
  const { user } = useAuth();
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssignedClass();
  }, []);

  const fetchAssignedClass = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/api/assigned-class`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch class');
      await res.json();
    } catch (err: any) {
      setError('Could not fetch assigned class.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const previews: PreviewImage[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...previews]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      // Revoke the object URL to avoid memory leak
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpload = async () => {
    if (!title.trim() || images.length === 0) {
      setError('Title and at least one image are required.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      const formData = new FormData();
      formData.append('title', title);
      images.forEach((img) => formData.append('event_images', img.file));

      const response = await fetch(`${baseUrl}/api/upload-event-images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);

      const newImageUrls = data.data.map((img: any) => `${baseUrl}${img.image_url}`);
      setUploadedImages((prev) => [...prev, ...newImageUrls]);
      setImages([]);
      setTitle('');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter Event Title"
            className="border px-4 py-2 rounded-md w-full md:w-1/2"
          />
          <label className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded cursor-pointer">
            Select Images
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
          </label>
          <button
            onClick={handleUpload}
            disabled={loading || images.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            {loading ? 'Uploading...' : 'Submit'}
          </button>
        </div>

        {error && <div className="text-red-600 mb-4">{error}</div>}

        {/* Selected Images Before Upload */}
        {images.length > 0 && (
          <div>
            <h2 className="text-lg font-medium mb-2">Selected Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {images.map((img, index) => (
                <div key={index} className="relative">
                  <Image
                    src={img.previewUrl}
                    alt={`Preview ${index}`}
                    width={300}
                    height={200}
                    className="rounded-md object-cover"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center hover:bg-red-700"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Images */}
        {uploadedImages.length > 0 && (
          <div>
            <h2 className="text-lg font-medium mb-2">Uploaded Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedImages.map((img, index) => (
                <div
                  key={index}
                  className="cursor-pointer hover:opacity-90"
                  onClick={() => setSelectedImage(img)}
                >
                  <Image
                    src={img}
                    alt={`Event ${index}`}
                    width={300}
                    height={200}
                    className="rounded-md object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fullscreen Image Preview */}
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
