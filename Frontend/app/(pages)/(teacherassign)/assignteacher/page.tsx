"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
 import toast from "react-hot-toast";
import DashboardLayout from "@/app/dashboardComponents/DashboardLayout";
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";

interface Teacher {
  id: string;
  name: string;
}

interface ClassModel {
  id: number;
  className: string;
  sections: string[];
}

interface Subject {
  id: string;
  subjectName: string;
}

const AssignTeacherPage = () => {
  const [token, setToken] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassModel | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const localToken = localStorage.getItem("token");
    if (!localToken) {
      toast.error("No token found. Please login.");
      router.push("/login");
      return;
    }
    setToken(localToken);
    Promise.all([fetchTeachers(localToken), fetchClasses(localToken)]).finally(
      () => setIsLoading(false)
    );
  }, []);

  const fetchTeachers = async (tk: string) => {
    try {
      const res = await axios.get(`${baseUrl}/api/teachers`, {
        headers: { Authorization: `Bearer ${tk}` },
      });
      const data = res.data.map((t: any) => ({
        id: t.id.toString(),
        name: t.teacher_name ?? "Unknown",
      }));
      setTeachers(data);
    } catch (err: any) {
      toast.error("Failed to fetch teachers");
    }
  };

  const fetchClasses = async (tk: string) => {
    try {
      const res = await axios.get(`${baseUrl}/api/classes`, {
        headers: { Authorization: `Bearer ${tk}` },
      });
      const map: Record<string, ClassModel> = {};
      res.data.forEach((e: any) => {
        const name = e.class_name;
        const section = e.section;
        const id = parseInt(e.id);
        if (!map[name]) map[name] = { id, className: name, sections: [] };
        if (section && !map[name].sections.includes(section)) {
          map[name].sections.push(section);
        }
      });
      setClasses(Object.values(map));
    } catch (err: any) {
      toast.error("Failed to fetch classes");
    }
  };

  const fetchSubjects = async (classId: number, section: string) => {
    setSubjects([]);
    setSelectedSubjectIds([]);
    try {
      const res = await axios.get(`${baseUrl}/api/getallsubjects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const responseData = res.data.data || res.data; // Adjust based on your API response structure
      if (!Array.isArray(responseData)) {
        toast.error("Invalid subjects data format");
        return;
      }
  
      // Find the class that matches classId and section
      const matchedClass = responseData.find(
        (c: any) =>
          parseInt(c.id) === classId
      );
  
      const subs: Subject[] = [];
      if (matchedClass && Array.isArray(matchedClass.subjects)) {
        matchedClass.subjects.forEach((subject: any) => {
          // Handle comma-separated subject names
          if (subject.subject_name && subject.subject_name.includes(',')) {
            const subjectNames = subject.subject_name
              .split(',')
              .map((name: string) => name.trim())
              .filter((name: string) => name); // Remove empty names
  
            subjectNames.forEach((name: string) => {
              subs.push({
                id: subject.id.toString(), // Use the same ID for all split subjects
                subjectName: name,
              });
            });
          } else {
            // Single subject
            const name = subject.subject_name?.trim();
            if (name) {
              subs.push({
                id: subject.id.toString(),
                subjectName: name,
              });
            }
          }
        });
      }
  
      if (subs.length === 0) {
        toast("No subjects found for this class/section.");
      } else {
        setSubjects(subs);
      }
    } catch (err) {
      toast.error("Error fetching subjects");
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTeacher || !selectedClass || !selectedSection || selectedSubjectIds.length === 0) {
      toast.error("Please complete all fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post(
        `${baseUrl}/api/assign-teacher`,
        {
          teacher_id: selectedTeacher.id,
          class_id: selectedClass.id,
          section: selectedSection,
          subject_ids: selectedSubjectIds,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Teacher Assigned Successfully");
      setSelectedTeacher(null);
      setSelectedClass(null);
      setSelectedSection(null);
      setSubjects([]);
      setSelectedSubjectIds([]);
      setAvailableSections([]);
    } catch (err) {
      toast.error("Failed to assign teacher");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <DashboardLayout>
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-6 text-blue-900">Assign Teacher to Class</h1>
      <div className="space-y-4">
        <select
          className="w-full border p-2 rounded text-gray-500"
          value={selectedTeacher?.id || ""}
          onChange={(e) =>
            setSelectedTeacher(teachers.find((t) => t.id === e.target.value) || null)
          }
        >
          <option value="">Select Teacher</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <select
          className="w-full border p-2 rounded text-gray-500"
          value={selectedClass?.id || ""}
          onChange={(e) => {
            const found = classes.find((c) => c.id === parseInt(e.target.value));
            setSelectedClass(found || null);
            setSelectedSection(null);
            setSubjects([]);
            setSelectedSubjectIds([]);
            setAvailableSections(found?.sections || []);
          }}
        >
          <option value="">Select Class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.className}</option>
          ))}
        </select>

        {selectedClass && (
          <select
            className="w-full border p-2 rounded text-gray-500"
            value={selectedSection || ""}
            onChange={(e) => {
              setSelectedSection(e.target.value);
              if (selectedClass && e.target.value) {
                fetchSubjects(selectedClass.id, e.target.value);
              }
            }}
          >
            <option value="">Select Section</option>
            {availableSections.map((sec, i) => (
              <option key={i} value={sec}>{sec}</option>
            ))}
          </select>
        )}

        {subjects.length > 0 && (
          <div>
            <label className="block font-medium mb-2 text-gray-500">Subjects</label>
            <div className="space-y-2">
              {subjects.map((sub) => (
                <label key={sub.id} className="flex items-center gap-2 text-gray-500">
                  <input
                    type="checkbox"
                    checked={selectedSubjectIds.includes(sub.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubjectIds([...selectedSubjectIds, sub.id]);
                      } else {
                        setSelectedSubjectIds(
                          selectedSubjectIds.filter((id) => id !== sub.id)
                        );
                      }
                    }}
                  />
                  {sub.subjectName}
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          className="bg-blue-900 text-white px-4 py-2 rounded"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Assigning..." : "Assign Teacher"}
        </button>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default AssignTeacherPage;