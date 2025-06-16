import { z } from 'zod';

// Schema para validação das atribuições de equipe
export const assignTeamSchema = z.object({
  teamId: z.number().nullable(),
  method: z.enum(['manual', 'automatic']).default('manual')
});

// Schema para validação das atribuições de usuário
export const assignUserSchema = z.object({
  userId: z.number().nullable(),
  method: z.enum(['manual', 'automatic']).default('manual')
}); 