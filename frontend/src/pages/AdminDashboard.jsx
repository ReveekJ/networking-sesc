import React, { useState, useEffect } from 'react';
import SurveyCreator from '../components/Admin/SurveyCreator';
import SurveyDashboard from '../components/Admin/SurveyDashboard';
import '../App.css';

const STORAGE_KEYS = {
  CURRENT_SURVEY_ID: 'admin_current_survey_id',
  SHOW_DASHBOARD: 'admin_show_dashboard'
};

const AdminDashboard = () => {
  const [currentSurveyId, setCurrentSurveyId] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);

  // Restore state from localStorage on mount
  useEffect(() => {
    const savedSurveyId = localStorage.getItem(STORAGE_KEYS.CURRENT_SURVEY_ID);
    const savedShowDashboard = localStorage.getItem(STORAGE_KEYS.SHOW_DASHBOARD);
    
    if (savedSurveyId) {
      setCurrentSurveyId(parseInt(savedSurveyId, 10));
    }
    if (savedShowDashboard === 'true') {
      setShowDashboard(true);
    }
  }, []);

  // Save currentSurveyId to localStorage whenever it changes
  useEffect(() => {
    if (currentSurveyId !== null) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SURVEY_ID, currentSurveyId.toString());
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SURVEY_ID);
    }
  }, [currentSurveyId]);

  // Save showDashboard to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHOW_DASHBOARD, showDashboard.toString());
  }, [showDashboard]);

  const handleSurveyCreated = (survey) => {
    setCurrentSurveyId(survey.id);
    // Не переключаемся автоматически, показываем информацию о ссылке и QR коде
  };

  const handleGoToDashboard = () => {
    setShowDashboard(true);
  };

  const handleBackToCreator = () => {
    setShowDashboard(false);
    setCurrentSurveyId(null);
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Панель управления опросами</h1>
        
        {!currentSurveyId || !showDashboard ? (
          <SurveyCreator 
            onSurveyCreated={handleSurveyCreated}
            surveyId={currentSurveyId}
            onGoToDashboard={handleGoToDashboard}
          />
        ) : (
          <>
            <button 
              className="button" 
              onClick={handleBackToCreator}
              style={{ marginBottom: '20px' }}
            >
              ← Вернуться к созданию опросов
            </button>
            <SurveyDashboard surveyId={currentSurveyId} />
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

