import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { API_BASE_URL } from '../../utils/constants';
import TeamsList from './TeamsList';
import StageController from './StageController';
import Loading from '../common/Loading';
import './SurveyDashboard.css';

const SurveyDashboard = ({ surveyId }) => {
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // WebSocket for teams status
  const wsUrl = surveyId ? `${API_BASE_URL}/ws/admin/survey/${surveyId}` : null;
  const { data: statusData } = useWebSocket(
    wsUrl,
    !!surveyId
  );

  const [teams, setTeams] = useState([]);

  useEffect(() => {
    loadSurvey();
  }, [surveyId]);

  useEffect(() => {
    if (statusData) {
      // Update survey status from WebSocket data
      if (statusData.survey_id === surveyId) {
        setSurvey(prev => prev ? {
          ...prev,
          status: statusData.status,
          current_stage: statusData.current_stage
        } : null);
        // Update teams from WebSocket data
        if (statusData.teams) {
          setTeams(statusData.teams);
        }
      }
    }
  }, [statusData, surveyId]);

  const loadSurvey = async () => {
    try {
      // Load survey basic info
      const surveyResponse = await adminApi.getSurvey(surveyId);
      setSurvey(surveyResponse.data);
      
      // Load survey status with teams
      const statusResponse = await adminApi.getSurveyStatus(surveyId);
      if (statusResponse.data.teams) {
        setTeams(statusResponse.data.teams);
      }
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при загрузке опроса');
    } finally {
      setLoading(false);
    }
  };


  const handleStart = async () => {
    setActionLoading(true);
    try {
      const response = await adminApi.startSurvey(surveyId);
      setSurvey(response.data);
      // WebSocket will update status automatically
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при запуске опроса');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNextStage = async () => {
    setActionLoading(true);
    try {
      const response = await adminApi.nextStage(surveyId);
      setSurvey(response.data);
      // WebSocket will update status automatically
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при переходе к следующему этапу');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error && !survey) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="survey-dashboard">
      <h2>{survey?.title}</h2>
      <div className="survey-meta">
        <span className="status-badge">{survey?.status}</span>
        <span className="invite-code">Код: {survey?.invite_code}</span>
      </div>

      <StageController
        currentStage={survey?.current_stage}
        surveyStatus={survey?.status}
        onStart={handleStart}
        onNextStage={handleNextStage}
        loading={actionLoading}
      />

      {survey?.status === 'active' && (
        <TeamsList teams={teams} currentStage={survey?.current_stage} />
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default SurveyDashboard;

