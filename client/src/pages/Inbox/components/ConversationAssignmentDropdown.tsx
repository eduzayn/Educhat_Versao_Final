import { useState, useEffect } from "react";
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
import { Users, User } from "lucide-react";
import { useToast } from "@/shared/lib/hooks/use-toast";
import type { Team, SystemUser } from "@shared/schema";

interface ConversationAssignmentDropdownProps {
  conversationId: number;
  currentTeamId?: number | null;
  currentUserId?: number | null;
  detectedTeam?: string | null;
}

export function ConversationAssignmentDropdown({
  conversationId,
  currentTeamId,
  currentUserId,
  detectedTeam,
}: ConversationAssignmentDropdownProps) {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [teamUsers, setTeamUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Utilitário para cache localStorage com validade
  const getCache = (key: string, ttl = 300_000) => {
    const item = sessionStorage.getItem(key);
    if (!item) return null;
    try {
      const parsed = JSON.parse(item);
      return Date.now() - parsed.timestamp < ttl ? parsed.data : null;
    } catch {
      return null;
    }
  };

  const setCache = (key: string, data: any) => {
    sessionStorage.setItem(
      key,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
  };

  // 🔁 Carregar times e usuários com cache
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let teamsData = getCache("assignment-teams");
        let usersData = getCache("assignment-users");

        if (!teamsData || !usersData) {
          const [teamsRes, usersRes] = await Promise.all([
            fetch("/api/teams"),
            fetch("/api/system-users"),
          ]);
          if (teamsRes.ok) {
            teamsData = await teamsRes.json();
            setCache("assignment-teams", teamsData);
          }
          if (usersRes.ok) {
            usersData = await usersRes.json();
            setCache("assignment-users", usersData);
          }
        }

        setTeams(Array.isArray(teamsData) ? teamsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // 🔁 Carregar membros da equipe selecionada
  useEffect(() => {
    if (!currentTeamId) return setTeamUsers([]);
    const key = `team-users-${currentTeamId}`;
    const cached = getCache(key);
    if (cached) return setTeamUsers(cached);

    const loadTeamUsers = async () => {
      try {
        const res = await fetch(`/api/teams/${currentTeamId}/users`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const valid = Array.isArray(data) ? data : [];
        setTeamUsers(valid);
        setCache(key, valid);
      } catch {
        console.error("Erro ao buscar membros da equipe");
      }
    };
    loadTeamUsers();
  }, [currentTeamId]);

  const currentTeam = teams.find((t) => t.id === currentTeamId);
  const currentUser = users.find((u) => u.id === currentUserId);

  // 🔁 Handlers de atribuição
  const assignToTeam = async (value: string) => {
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/assign-team`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId: value === "none" ? null : parseInt(value),
            method: "manual",
          }),
        },
      );
      if (!res.ok) throw new Error();
      toast({
        title: "Equipe atribuída",
        description:
          value === "none"
            ? "Conversa movida para fila neutra"
            : "Conversa atribuída com sucesso",
      });
      window.location.reload();
    } catch {
      toast({
        title: "Erro ao atribuir equipe",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const assignToUser = async (value: string) => {
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/assign-user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: value === "none" ? null : parseInt(value),
            method: "manual",
          }),
        },
      );
      if (!res.ok) throw new Error();
      toast({
        title: "Usuário atribuído",
        description:
          value === "none"
            ? "Atribuição removida"
            : "Conversa atribuída ao usuário",
      });
      window.location.reload();
    } catch {
      toast({
        title: "Erro ao atribuir usuário",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (loading)
    return <span className="text-xs text-gray-500">Carregando equipes...</span>;

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* Equipe */}
      <div className="flex items-center gap-1">
        <Users className="w-4 h-4 text-gray-400" />
        <Select
          value={currentTeamId?.toString() ?? "none"}
          onValueChange={assignToTeam}
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
                          backgroundColor: currentTeam.color + "20",
                          color: currentTeam.color,
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
      </div>

      {/* Usuário */}
      <div className="flex items-center gap-1">
        <User className="w-4 h-4 text-gray-400" />
        <Select
          value={currentUserId?.toString() ?? "none"}
          onValueChange={assignToUser}
        >
          <SelectTrigger className="h-7 min-w-[140px] border-gray-300 text-xs">
            <SelectValue>
              {currentUser ? (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  {currentUser.displayName}
                </Badge>
              ) : (
                "Não atribuído"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Não atribuído</SelectItem>
            {(currentTeamId ? teamUsers : users)
              .filter((u) => u.isActive)
              .map((u) => (
                <SelectItem key={u.id} value={u.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${u.isOnline ? "bg-green-500" : "bg-gray-400"}`}
                    />
                    {u.displayName}
                    <span className="text-[10px] text-gray-500 ml-1">
                      ({u.username})
                    </span>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Detecção de equipe automática */}
      {detectedTeam && (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-600 border-blue-200 text-[10px]"
        >
          Detectado: {detectedTeam}
        </Badge>
      )}
    </div>
  );
}
