export interface ITeamDetectionStorage {
  getTeamDetections(): Promise<any[]>;
  getTeamDetection(id: number): Promise<any>;
  createTeamDetection(data: any): Promise<any>;
  updateTeamDetection(id: number, data: any): Promise<any>;
  deleteTeamDetection(id: number): Promise<void>;
  getTeamDetectionKeywords(teamDetectionId: number): Promise<any[]>;
  createTeamDetectionKeyword(teamDetectionId: number, data: any): Promise<any>;
  deleteTeamDetectionKeyword(teamDetectionId: number, keywordId: number): Promise<void>;
  testTeamDetection(text: string): Promise<any>;
  detectTeam(content: string, channel?: string): string | null;
} 