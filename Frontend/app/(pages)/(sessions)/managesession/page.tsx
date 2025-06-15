"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/app/dashboardComponents/DashboardLayout";
import { RefreshCw, Plus, Trash2, Edit } from "lucide-react";
import { useRouter } from "next/navigation";

interface Session {
  id: number;
  session_name: string;
  start_date: string;
  end_date: string;
}

const ManageSessionsPage: React.FC = () => {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${baseUrl}/api/getsession`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch sessions");

      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        setSessions(result.data);
      } else {
        throw new Error("Invalid session data format");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    try {
      setDeleteLoading(id);

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${baseUrl}/api/session/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete session");

      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete session");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/editsession?id=${id}`);
  };

  const handleAddNew = () => {
    router.push("/addsession");
  };

  const handleRefresh = () => {
    fetchSessions();
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-100 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl text-gray-500 font-bold">
            Sessions | Manage Sessions
          </h1>
          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg flex items-center space-x-2"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Session</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Session Cards */}
        {loading ? (
          <div className="flex justify-center items-center h-64 text-gray-500 space-x-2">
            <RefreshCw className="animate-spin" size={20} />
            <span>Loading...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No sessions found</p>
            <button
              onClick={handleAddNew}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <Plus size={20} />
              <span>Add Your First Session</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white p-4 rounded-lg shadow-md relative group hover:shadow-lg transition-shadow"
              >
                {/* Edit & Delete Buttons */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                  <button
                    onClick={() => handleEdit(session.id)}
                    className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                    title="Edit Session"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full"
                    title="Delete Session"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Session Info */}
                <div className="text-xl font-bold text-gray-800 mb-2">
                  {session.session_name}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  Start: {new Date(session.start_date).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600">
                  End: {new Date(session.end_date).toLocaleDateString()}
                </div>

                {/* Deleting Loader */}
                {deleteLoading === session.id && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                    <div className="flex items-center space-x-2 text-red-600">
                      <RefreshCw className="animate-spin" size={16} />
                      <span className="text-sm">Deleting...</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageSessionsPage;
