import { Router } from 'express';
import { gamificationService } from '../services/gamificationService';
import { requireAuth } from '../core/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(requireAuth);

// GET /api/gamification/dashboard - Dashboard completo do usuário
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Buscar dados em paralelo
    const [
      badges,
      achievements,
      dailyStats,
      weeklyStats,
      monthlyStats,
      dailyLeaderboard,
      weeklyLeaderboard,
      monthlyLeaderboard
    ] = await Promise.all([
      gamificationService.getUserBadges(userId),
      gamificationService.getUserAchievements(userId, 5),
      gamificationService.getUserStats(userId, 'daily'),
      gamificationService.getUserStats(userId, 'weekly'),
      gamificationService.getUserStats(userId, 'monthly'),
      gamificationService.getLeaderboard('total_points', 'daily', undefined, 5),
      gamificationService.getLeaderboard('total_points', 'weekly', undefined, 5),
      gamificationService.getLeaderboard('total_points', 'monthly', undefined, 5)
    ]);

    // Encontrar posição do usuário nos leaderboards
    const userDailyPosition = dailyLeaderboard.findIndex(entry => entry.userId === userId) + 1;
    const userWeeklyPosition = weeklyLeaderboard.findIndex(entry => entry.userId === userId) + 1;
    const userMonthlyPosition = monthlyLeaderboard.findIndex(entry => entry.userId === userId) + 1;

    res.json({
      success: true,
      data: {
        badges: {
          earned: badges.filter(b => b.isEarned),
          available: badges.filter(b => !b.isEarned),
          total: badges.length,
          earnedCount: badges.filter(b => b.isEarned).length
        },
        achievements,
        stats: {
          daily: dailyStats,
          weekly: weeklyStats,
          monthly: monthlyStats
        },
        leaderboards: {
          daily: dailyLeaderboard,
          weekly: weeklyLeaderboard,
          monthly: monthlyLeaderboard
        },
        userPositions: {
          daily: userDailyPosition || null,
          weekly: userWeeklyPosition || null,
          monthly: userMonthlyPosition || null
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dashboard de gamificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/gamification/badges - Badges do usuário
router.get('/badges', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const badges = await gamificationService.getUserBadges(userId);
    
    // Agrupar por categoria
    const badgesByCategory = badges.reduce((acc, badge) => {
      if (!acc[badge.category]) {
        acc[badge.category] = [];
      }
      acc[badge.category].push(badge);
      return acc;
    }, {} as Record<string, typeof badges>);

    res.json({
      success: true,
      badges: badgesByCategory,
      summary: {
        total: badges.length,
        earned: badges.filter(b => b.isEarned).length,
        available: badges.filter(b => !b.isEarned).length,
        categories: Object.keys(badgesByCategory)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar badges:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/gamification/achievements - Achievements do usuário
router.get('/achievements', async (req, res) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const achievements = await gamificationService.getUserAchievements(userId, limit);

    res.json({
      success: true,
      achievements
    });

  } catch (error) {
    console.error('Erro ao buscar achievements:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/gamification/leaderboard - Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const metric = req.query.metric as string || 'total_points';
    const period = req.query.period as 'daily' | 'weekly' | 'monthly' || 'weekly';
    const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : undefined;
    const limit = parseInt(req.query.limit as string) || 10;

    const leaderboard = await gamificationService.getLeaderboard(metric, period, teamId, limit);

    res.json({
      success: true,
      leaderboard,
      filters: {
        metric,
        period,
        teamId,
        limit
      }
    });

  } catch (error) {
    console.error('Erro ao buscar leaderboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/gamification/stats - Estatísticas do usuário
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user?.id;
    const period = req.query.period as 'daily' | 'weekly' | 'monthly' || 'weekly';
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const stats = await gamificationService.getUserStats(userId, period);

    res.json({
      success: true,
      stats,
      period
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/gamification/update-stats - Atualizar estatísticas (uso interno)
router.post('/update-stats', async (req, res) => {
  try {
    const { userId, period = 'daily' } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    await gamificationService.updateUserStats(userId, period, new Date());

    res.json({
      success: true,
      message: 'Estatísticas atualizadas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;