export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const SURVEY_STAGES = {
  QUESTION: 'question',
  VOTING: 'voting',
  RESULTS: 'results'
};

export const SURVEY_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  COMPLETED: 'completed'
};

