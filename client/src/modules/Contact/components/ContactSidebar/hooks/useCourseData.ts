import { useState, useEffect } from 'react';

export const useCourseData = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<string[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/courses/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
      }
    };

    const fetchAllCourses = async () => {
      try {
        const response = await fetch('/api/courses');
        if (response.ok) {
          const data = await response.json();
          setCourses(data);
          setFilteredCourses(data);
        }
      } catch (error) {
        console.error('Erro ao buscar cursos:', error);
      }
    };

    fetchCategories();
    fetchAllCourses();
  }, []);

  const filterCoursesByCategory = async (category: string) => {
    if (category && category !== '') {
      try {
        const response = await fetch(`/api/courses/by-category/${encodeURIComponent(category)}`);
        if (response.ok) {
          const data = await response.json();
          setFilteredCourses(data);
        }
      } catch (error) {
        console.error('Erro ao buscar cursos por categoria:', error);
        setFilteredCourses(courses);
      }
    } else {
      setFilteredCourses(courses);
    }
  };

  return {
    categories,
    courses,
    filteredCourses,
    filterCoursesByCategory
  };
};