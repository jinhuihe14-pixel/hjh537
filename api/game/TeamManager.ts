
import { TeamData, TeamMember } from '../../shared/types/game.js';
import { Player } from './PlayerManager.js';

export class TeamManager {
  private teams: Map<string, TeamData> = new Map();
  private playerToTeam: Map<string, string> = new Map();
  
  createTeam(leader: Player): TeamData {
    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const member: TeamMember = {
      playerId: leader.id,
      playerName: leader.data.name,
      level: leader.data.level,
      playerClass: leader.data.playerClass,
      health: leader.data.health,
      maxHealth: leader.data.maxHealth,
    };
    
    const team: TeamData = {
      id: teamId,
      leaderId: leader.id,
      maxMembers: 5,
      members: [member],
    };
    
    this.teams.set(teamId, team);
    this.playerToTeam.set(leader.id, teamId);
    
    return team;
  }
  
  joinTeam(teamId: string, player: Player): TeamData | null {
    const team = this.teams.get(teamId);
    if (!team) return null;
    if (team.members.length >= team.maxMembers) return null;
    
    if (this.playerToTeam.has(player.id)) {
      this.leaveTeam(player.id);
    }
    
    const member: TeamMember = {
      playerId: player.id,
      playerName: player.data.name,
      level: player.data.level,
      playerClass: player.data.playerClass,
      health: player.data.health,
      maxHealth: player.data.maxHealth,
    };
    
    team.members.push(member);
    this.playerToTeam.set(player.id, teamId);
    
    return team;
  }
  
  leaveTeam(playerId: string): boolean {
    const teamId = this.playerToTeam.get(playerId);
    if (!teamId) return false;
    
    const team = this.teams.get(teamId);
    if (!team) return false;
    
    team.members = team.members.filter(m => m.playerId !== playerId);
    this.playerToTeam.delete(playerId);
    
    if (team.members.length === 0) {
      this.teams.delete(teamId);
    } else if (team.leaderId === playerId) {
      team.leaderId = team.members[0].playerId;
    }
    
    return true;
  }
  
  getTeam(teamId: string): TeamData | undefined {
    return this.teams.get(teamId);
  }
  
  getPlayerTeam(playerId: string): TeamData | null {
    const teamId = this.playerToTeam.get(playerId);
    return teamId ? this.teams.get(teamId) || null : null;
  }
  
  updateMemberHealth(playerId: string, health: number): void {
    const teamId = this.playerToTeam.get(playerId);
    if (!teamId) return;
    
    const team = this.teams.get(teamId);
    if (!team) return;
    
    const member = team.members.find(m => m.playerId === playerId);
    if (member) {
      member.health = health;
    }
  }
  
  getTeamCount(): number {
    return this.teams.size;
  }
}
