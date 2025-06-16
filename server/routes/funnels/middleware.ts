import { Request, Response, NextFunction } from 'express';
import { TEAM_TYPES } from './config';

export const validateTeamType = (req: Request, res: Response, next: NextFunction) => {
  const { teamType } = req.params;
  if (!Object.values(TEAM_TYPES).includes(teamType as any)) {
    return res.status(400).json({
      error: 'Tipo de equipe inválido'
    });
  }
  next();
};

export const validateTeamId = (req: Request, res: Response, next: NextFunction) => {
  const teamId = parseInt(req.params.teamId);
  if (isNaN(teamId)) {
    return res.status(400).json({
      error: 'ID da equipe inválido'
    });
  }
  next();
}; 