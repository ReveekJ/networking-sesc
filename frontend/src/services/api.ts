import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface QuizCreate {
  title: string;
  questions: QuestionCreate[];
}

export interface QuestionCreate {
  text: string;
  order: number;
  type: 'text_input' | 'multiple_choice';
  is_last: boolean;
  options?: QuestionOptionCreate[];
}

export interface QuestionOptionCreate {
  text: string;
  order: number;
}

export interface QuizResponse {
  id: string;
  title: string;
  invite_code: string;
  status: string;
  current_question_order: number | null;
  created_at: string;
  updated_at: string;
  questions: QuestionResponse[];
}

export interface QuestionResponse {
  id: string;
  order: number;
  text: string;
  type: string;
  is_last: boolean;
  options: QuestionOptionResponse[];
}

export interface QuestionOptionResponse {
  id: string;
  text: string;
  order: number;
}

export interface TeamCreate {
  name: string;
  participants: ParticipantCreate[];
}

export interface ParticipantCreate {
  first_name: string;
  last_name: string;
  contact_info?: { [key: string]: string };
  profession?: string;
}

export interface TeamResponse {
  id: string;
  name: string;
  joined_at: string;
  participants: ParticipantResponse[];
}

export interface ParticipantResponse {
  id: string;
  first_name: string;
  last_name: string;
  contact_info?: { [key: string]: string };
  profession?: string;
}

export interface AnswerCreate {
  question_id: string;
  text_answer?: string;
  selected_options?: string[];
}

export interface AnswerResponse {
  id: string;
  question_id: string;
  text_answer?: string;
  selected_options?: string[];
  answered_at: string;
}

export interface StatisticsResponse {
  question_id: string;
  question_text: string;
  total_answers: number;
  options: OptionStatistics[];
}

export interface OptionStatistics {
  option_id: string;
  option_text: string;
  count: number;
  percentage: number;
}

export const quizApi = {
  createQuiz: async (data: QuizCreate): Promise<QuizResponse> => {
    const response = await api.post<QuizResponse>('/api/quizzes', data);
    return response.data;
  },

  getQuiz: async (inviteCode: string): Promise<QuizResponse> => {
    const response = await api.get<QuizResponse>(`/api/quizzes/${inviteCode}`);
    return response.data;
  },

  createTeam: async (inviteCode: string, data: TeamCreate): Promise<TeamResponse> => {
    const response = await api.post<TeamResponse>(`/api/quizzes/${inviteCode}/teams`, data);
    return response.data;
  },

  getTeams: async (inviteCode: string): Promise<TeamResponse[]> => {
    const response = await api.get<TeamResponse[]>(`/api/quizzes/${inviteCode}/teams`);
    return response.data;
  },

  startQuiz: async (inviteCode: string): Promise<void> => {
    await api.post(`/api/quizzes/${inviteCode}/start`);
  },

  getCurrentQuestion: async (inviteCode: string): Promise<QuestionResponse> => {
    const response = await api.get<QuestionResponse>(`/api/quizzes/${inviteCode}/current-question`);
    return response.data;
  },

  nextQuestion: async (inviteCode: string): Promise<void> => {
    await api.post(`/api/quizzes/${inviteCode}/next-question`);
  },

  submitAnswer: async (inviteCode: string, participantId: string, data: AnswerCreate): Promise<AnswerResponse> => {
    const response = await api.post<AnswerResponse>(
      `/api/quizzes/${inviteCode}/answers?participant_id=${participantId}`,
      data
    );
    return response.data;
  },

  getStatistics: async (inviteCode: string): Promise<StatisticsResponse> => {
    const response = await api.get<StatisticsResponse>(`/api/quizzes/${inviteCode}/statistics`);
    return response.data;
  },
};

export default api;

