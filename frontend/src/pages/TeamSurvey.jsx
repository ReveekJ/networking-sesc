import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { teamApi } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { API_BASE_URL } from '../utils/constants';
import RegistrationForm from '../components/Team/RegistrationForm';
import QuestionStage from '../components/Team/QuestionStage';
import VotingStage from '../components/Team/VotingStage';
import ResultsStage from '../components/Team/ResultsStage';
import Loading from '../components/common/Loading';
import '../App.css';

const TeamSurvey = () => {
  const { inviteCode } = useParams();
  const [survey, setSurvey] = useState(null);
  const [team, setTeam] = useState(null);
  const [teamStatus, setTeamStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // WebSocket for survey info by invite code
  const surveyWsUrl = inviteCode ? `${API_BASE_URL}/ws/team/survey/${inviteCode}` : null;
  const { data: wsSurveyInfo } = useWebSocket(surveyWsUrl, !!inviteCode);

  // WebSocket for team status
  const teamWsUrl = team?.id ? `${API_BASE_URL}/ws/team/${team.id}` : null;
  const { data: wsTeamStatus } = useWebSocket(teamWsUrl, !!team?.id);

  const loadSurveyInfo = async () => {
    try {
      const response = await teamApi.getSurveyInfo(inviteCode);
      setSurvey(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Опрос не найден');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamStatus = async (teamId) => {
    try {
      const response = await teamApi.getTeamStatus(teamId);
      setTeamStatus(response.data);
    } catch (err) {
      console.error('Error loading team status:', err);
    }
  };

  // Restore team from localStorage on mount
  useEffect(() => {
    if (inviteCode) {
      const storageKey = `team_${inviteCode}`;
      const savedTeam = localStorage.getItem(storageKey);
      if (savedTeam) {
        try {
          const teamData = JSON.parse(savedTeam);
          setTeam(teamData);
          // Load team status if team is restored
          if (teamData?.id) {
            loadTeamStatus(teamData.id).catch(err => {
              console.error('Error loading team status:', err);
            });
          }
        } catch (err) {
          console.error('Error parsing saved team data:', err);
          localStorage.removeItem(storageKey);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode]);

  // Save team to localStorage whenever it changes
  useEffect(() => {
    if (team && inviteCode) {
      const storageKey = `team_${inviteCode}`;
      localStorage.setItem(storageKey, JSON.stringify(team));
    }
  }, [team, inviteCode]);

  useEffect(() => {
    loadSurveyInfo();
  }, [inviteCode]);

  useEffect(() => {
    if (wsSurveyInfo) {
      setSurvey(prev => {
        if (prev) {
          return {
            ...prev,
            status: wsSurveyInfo.status,
            current_stage: wsSurveyInfo.current_stage
          };
        } else {
          // If survey not loaded yet, use WebSocket data
          return {
            id: wsSurveyInfo.id,
            title: wsSurveyInfo.title || '',
            status: wsSurveyInfo.status,
            current_stage: wsSurveyInfo.current_stage
          };
        }
      });
    }
  }, [wsSurveyInfo]);

  useEffect(() => {
    if (wsTeamStatus) {
      setTeamStatus(wsTeamStatus);
    }
  }, [wsTeamStatus]);

  const handleRegistered = (teamData) => {
    setTeam(teamData);
    // Save to localStorage
    if (inviteCode) {
      const storageKey = `team_${inviteCode}`;
      localStorage.setItem(storageKey, JSON.stringify(teamData));
    }
    // WebSocket will update team status automatically
  };

  const handleQuestionComplete = () => {
    // WebSocket will update team status automatically
  };

  const handleVotingComplete = () => {
    // WebSocket will update team status automatically
  };

  if (loading) {
    return <Loading />;
  }

  if (error && !survey) {
    return (
      <div className="app">
        <div className="container">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  // Registration stage
  if (!team) {
    return (
      <div className="app">
        <div className="container">
          <h1>{survey?.title}</h1>
          <RegistrationForm inviteCode={inviteCode} onRegistered={handleRegistered} />
        </div>
      </div>
    );
  }

  // Survey stages - prioritize survey.current_stage from WebSocket as it's updated immediately on stage change
  const currentStage = survey?.current_stage || teamStatus?.current_stage;
  const surveyStatus = survey?.status || teamStatus?.survey_status;
  const questionStatus = teamStatus?.question_status || 'pending';
  const votingStatus = teamStatus?.voting_status || 'pending';

  // Check if survey is not active
  if (surveyStatus !== 'active') {
    return (
      <div className="app">
        <div className="container">
          <h1>{survey?.title}</h1>
          <div className="team-info">
            <p>Команда: <strong>{team.name}</strong></p>
          </div>
          <div className="waiting-message">
            <p>Ожидание начала опроса...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if team has completed current stage
  const isQuestionStageCompleted = questionStatus === 'answered';
  const isVotingStageCompleted = votingStatus === 'answered';

  // Show waiting screen if team completed current stage but stage hasn't changed yet
  const showWaitingScreen = 
    (currentStage === 'question' && isQuestionStageCompleted) ||
    (currentStage === 'voting' && isVotingStageCompleted);

  return (
    <div className="app">
      <div className="container">
        <h1>{survey?.title}</h1>
        <div className="team-info">
          <p>Команда: <strong>{team.name}</strong></p>
        </div>

        {showWaitingScreen && (
          <div className="waiting-message">
            <div className="waiting-spinner"></div>
            <p>Ожидание следующего этапа...</p>
          </div>
        )}

        {!showWaitingScreen && currentStage === 'question' && (
          <QuestionStage
            teamId={team.id}
            onComplete={handleQuestionComplete}
          />
        )}

        {!showWaitingScreen && currentStage === 'voting' && (
          <VotingStage
            teamId={team.id}
            onComplete={handleVotingComplete}
          />
        )}

        {currentStage === 'results' && (
          <ResultsStage teamId={team.id} />
        )}

        {!showWaitingScreen && currentStage !== 'question' && currentStage !== 'voting' && currentStage !== 'results' && (
          <div className="waiting-message">
            <p>Ожидание начала опроса...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamSurvey;

