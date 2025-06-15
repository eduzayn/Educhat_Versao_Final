import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Badge } from "@/shared/ui/badge";
import { User } from "lucide-react";
import { useSystemUsers, useTeamUsers } from '../hooks/useAssignmentData';
import { useUserAssignment } from '../hooks/useAssignmentMutations';
import type { UserSelectorProps } from '../types';

export function UserSelector({
  conversationId,
  currentUserId,
  currentTeamId,
  onUserChange,
  isLoading = false,
}: UserSelectorProps) {
  const { data: allUsers = [], isLoading: usersLoading } = useSystemUsers();
  const { data: teamUsers = [] } = useTeamUsers(currentTeamId);
  const userAssignmentMutation = useUserAssignment(conversationId);

  // Use team users if a team is selected, otherwise use all users
  const availableUsers = currentTeamId ? teamUsers : allUsers;
  const currentUser = allUsers.find((u) => u.id === currentUserId);

  const handleUserChange = async (value: string) => {
    const userId = value === "none" ? null : parseInt(value);
    
    try {
      await userAssignmentMutation.mutateAsync({
        userId,
        method: 'manual',
      });
      onUserChange(userId);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  if (usersLoading) {
    return (
      <div className="flex items-center gap-1">
        <User className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <User className="w-4 h-4 text-gray-400" />
      <Select
        value={currentUserId?.toString() ?? "none"}
        onValueChange={handleUserChange}
        disabled={isLoading || userAssignmentMutation.isPending}
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
          {availableUsers
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
  );
}