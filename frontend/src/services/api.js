import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Admin API
export const adminApi = {
  createSurvey: (title) => {
    return api.post('/api/admin/surveys', { title });
  },
  
  getSurvey: (surveyId) => {
    return api.get(`/api/admin/surveys/${surveyId}`);
  },
  
  startSurvey: (surveyId) => {
    return api.post(`/api/admin/surveys/${surveyId}/start`, {});
  },
  
  nextStage: (surveyId) => {
    return api.post(`/api/admin/surveys/${surveyId}/next-stage`, {});
  },
  
  getSurveyStatus: (surveyId) => {
    return api.get(`/api/admin/surveys/${surveyId}/status`);
  },
  
  getSurveyResults: (surveyId) => {
    return api.get(`/api/admin/surveys/${surveyId}/results`);
  },
  
  getTeams: (surveyId) => {
    return api.get(`/api/admin/surveys/${surveyId}/teams`);
  }
};

// Team API
export const teamApi = {
  registerTeam: (data) => {
    return api.post('/api/teams/register', data);
  },
  
  getSurveyInfo: (inviteCode) => {
    return api.get(`/api/teams/survey/${inviteCode}`);
  },
  
  submitAnswers: (teamId, answers) => {
    return api.post(`/api/teams/teams/${teamId}/answers`, { answers });
  },
  
  submitVotes: (teamId, answerIds) => {
    return api.post(`/api/teams/teams/${teamId}/votes`, { answer_ids: answerIds });
  },
  
  getTeamStatus: (teamId) => {
    return api.get(`/api/teams/teams/${teamId}/status`);
  },
  
  getAvailableAnswers: (teamId) => {
    return api.get(`/api/teams/teams/${teamId}/available-answers`);
  },
  
  getTeamResults: (teamId) => {
    return api.get(`/api/teams/teams/${teamId}/results`);
  }
};

