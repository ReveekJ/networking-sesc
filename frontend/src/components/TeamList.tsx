import React from 'react';
import { TeamResponse } from '../services/api';
import './TeamList.css';

interface TeamListProps {
  teams: TeamResponse[];
}

const TeamList: React.FC<TeamListProps> = ({ teams }) => {
  if (teams.length === 0) {
    return (
      <div className="empty-teams">
        <p>Команды еще не зарегистрировались</p>
      </div>
    );
  }

  return (
    <div className="team-list">
      {teams.map((team) => (
        <div key={team.id} className="team-card">
          <div className="team-header">
            <h3>{team.name}</h3>
            <span className="team-participants-count">
              {team.participants.length} {team.participants.length === 1 ? 'участник' : 'участников'}
            </span>
          </div>
          <div className="participants-list">
            {team.participants.map((participant) => (
              <div key={participant.id} className="participant-item">
                <span className="participant-name">
                  {participant.last_name} {participant.first_name}
                </span>
                {participant.profession && (
                  <span className="participant-profession">{participant.profession}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamList;

