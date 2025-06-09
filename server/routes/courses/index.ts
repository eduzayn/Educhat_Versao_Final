import { Express, Request, Response } from 'express';
import { getCourseCategories, getCoursesByCategory, getAllCoursesGrouped } from '../../storage/utils/courseUtils';

export function registerCourseRoutes(app: Express) {
  // Obter todas as categorias de cursos
  app.get('/api/courses/categories', async (req: Request, res: Response) => {
    try {
      const categories = getCourseCategories();
      res.json(categories);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Obter cursos por categoria
  app.get('/api/courses/by-category/:category', async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const courses = getCoursesByCategory(category);
      res.json(courses);
    } catch (error) {
      console.error('Erro ao buscar cursos por categoria:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Obter todos os cursos agrupados por categoria
  app.get('/api/courses/grouped', async (req: Request, res: Response) => {
    try {
      const coursesGrouped = getAllCoursesGrouped();
      res.json(coursesGrouped);
    } catch (error) {
      console.error('Erro ao buscar cursos agrupados:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Obter lista plana de todos os cursos
  app.get('/api/courses', async (req: Request, res: Response) => {
    try {
      const coursesGrouped = getAllCoursesGrouped();
      const allCourses: string[] = [];
      
      for (const courses of Object.values(coursesGrouped)) {
        allCourses.push(...courses);
      }
      
      res.json(allCourses.sort());
    } catch (error) {
      console.error('Erro ao buscar cursos:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
}