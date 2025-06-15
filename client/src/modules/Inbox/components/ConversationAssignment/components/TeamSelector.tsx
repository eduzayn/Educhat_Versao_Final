import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Badge } from "@/shared/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { Users } from "lucide-react";
import { useTeams, useTeamUsers } from '../hooks/useAssignmentData';
import { useTeamAssignment } from '../hooks/useAssignmentMutations';
import type { TeamSelectorProps } from '../types';

export function TeamSelector({
  conversationId,
  currentTeamId,
  detectedTeam,
  onTeamChange,
  isLoading = false,
}: TeamSelectorProps) {
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: teamUsers = [] } = useTeamUsers(currentTeamId);
  const teamAssignmentMutation = useTeamAssignment(conversationId);

  const currentTeam = teams.find((t) => t.id === currentTeamId);

  const handleTeamChange = async (value: string) => {
    const teamId = value === "none" ? null : parseInt(value);
    
    try {
      await teamAssignmentMutation.mutateAsync({
        teamId,
        method: 'manual',
      });
      onTeamChange(teamId);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  if (teamsLoading) {
    return (
      <div className="flex items-center gap-1">
        <Users className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Users className="w-4 h-4 text-gray-400" />
      <Select
        value={currentTeamId?.toString() ?? "none"}
        onValueChange={handleTeamChange}
        disabled={isLoading || teamAssignmentMutation.isPending}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <SelectTrigger className="h-7 min-w-[140px] border-gray-300 text-xs">
                <SelectValue>
                  {currentTeam ? (
                    <Badge
                      variant="secondary"
                      className="text-xs px-2 py-0.5"
                      style={{
                        backgroundColor: (currentTeam.color || "#ccc") + "20",
                        color: currentTeam.color || "#ccc",
                      }}
                    >
                      {currentTeam.name}
                    </Badge>
                  ) : (
                    "Sem grupo"
                  )}
                </SelectValue>
              </SelectTrigger>
            </TooltipTrigger>
            {teamUsers.length > 0 && (
              <TooltipContent>
                <div className="text-sm">
                  <strong>Membros:</strong>
                  <ul className="mt-1 space-y-1">
                    {teamUsers
                      .filter((u) => u.isActive)
                      .map((u) => (
                        <li key={u.id} className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              u.isOnline ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          {u.displayName}
                        </li>
                      ))}
                  </ul>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <SelectContent>
          <SelectItem value="none">Sem grupo (neutro)</SelectItem>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id.toString()}>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: team.color || "#ccc" }}
                />
                {team.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Detecção de equipe automática */}
      {detectedTeam && (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-600 border-blue-200 text-[10px] ml-2"
        >
          Detectado: {detectedTeam}
        </Badge>
      )}
    </div>
  );
}