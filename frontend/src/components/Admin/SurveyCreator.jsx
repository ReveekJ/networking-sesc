import React, { useState } from 'react';
import { adminApi } from '../../services/api';
import QRCodeDisplay from './QRCodeDisplay';
import './SurveyCreator.css';

const SurveyCreator = ({ onSurveyCreated, surveyId, onGoToDashboard }) => {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [survey, setSurvey] = useState(null);
  const [error, setError] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.createSurvey(title);
      console.log('Survey created response:', response.data); // Debug log
      setSurvey(response.data);
      if (onSurveyCreated) {
        onSurveyCreated(response.data);
      }
      setTitle('');
    } catch (err) {
      console.error('Error creating survey:', err); // Debug log
      setError(err.response?.data?.detail || 'Ошибка при создании опроса');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="survey-creator">
      <h2>Создать опрос</h2>
      <form onSubmit={handleCreate}>
        <div>
          <label className="label">Название опроса</label>
          <input
            type="text"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Введите название опроса"
            required
          />
        </div>
        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Создание...' : 'Создать опрос'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {survey && (
        <div className="survey-info">
          <h3>✅ Опрос успешно создан!</h3>
          {survey.invite_code ? (
            <>
              <div className="invite-link">
                <label className="label">Пригласительная ссылка:</label>
                <div className="link-container">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/survey/${survey.invite_code}`}
                    className="input"
                  />
                  <button
                    className="button"
                    onClick={() => {
                      const link = `${window.location.origin}/survey/${survey.invite_code}`;
                      navigator.clipboard.writeText(link);
                      alert('Ссылка скопирована в буфер обмена!');
                    }}
                  >
                    Копировать
                  </button>
                </div>
              </div>
              <QRCodeDisplay qrCodeData={survey.qr_code_data} inviteCode={survey.invite_code} />
              {onGoToDashboard && (
                <div style={{ marginTop: '20px' }}>
                  <button
                    className="button"
                    onClick={onGoToDashboard}
                    style={{ width: '100%', backgroundColor: '#007bff', color: 'white' }}
                  >
                    Перейти к управлению опросом
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="error">
              Ошибка: не получен код приглашения. Попробуйте создать опрос еще раз.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SurveyCreator;

