import React, { useState, useEffect } from 'react';
import { teamApi } from '../../services/api';
import './VotingStage.css';

const VotingStage = ({ teamId, onComplete }) => {
  const [availableAnswers, setAvailableAnswers] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAnswers, setLoadingAnswers] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAvailableAnswers();
  }, [teamId]);

  const loadAvailableAnswers = async () => {
    try {
      const response = await teamApi.getAvailableAnswers(teamId);
      setAvailableAnswers(response.data.answers || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при загрузке вариантов');
    } finally {
      setLoadingAnswers(false);
    }
  };

  const toggleAnswer = (answerId) => {
    if (selectedAnswers.includes(answerId)) {
      setSelectedAnswers(selectedAnswers.filter(id => id !== answerId));
    } else {
      setSelectedAnswers([...selectedAnswers, answerId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedAnswers.length === 0) {
      setError('Выберите хотя бы один вариант');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await teamApi.submitVotes(teamId, selectedAnswers);
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при отправке голосов');
    } finally {
      setLoading(false);
    }
  };

  if (loadingAnswers) {
    return <div>Загрузка вариантов для голосования...</div>;
  }

  return (
    <div className="voting-stage">
      <h2>Голосование</h2>
      <p className="instruction">
        Выберите один или несколько вариантов ответов, за которые вы хотите проголосовать:
      </p>

      <form onSubmit={handleSubmit}>
        <div className="answers-list">
          {availableAnswers.length === 0 ? (
            <p>Пока нет вариантов для голосования</p>
          ) : (
            availableAnswers.map((answer) => (
              <div
                key={answer.id}
                className={`answer-option ${selectedAnswers.includes(answer.id) ? 'selected' : ''}`}
                onClick={() => toggleAnswer(answer.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedAnswers.includes(answer.id)}
                  onChange={() => toggleAnswer(answer.id)}
                  className="checkbox"
                />
                <div className="answer-content">
                  <div className="answer-text">{answer.content}</div>
                  <div className="answer-team">Команда: {answer.team_name}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {error && <div className="error">{error}</div>}

        <div className="selected-count">
          Выбрано: {selectedAnswers.length} из {availableAnswers.length}
        </div>

        <button type="submit" className="button" disabled={loading || selectedAnswers.length === 0}>
          {loading ? 'Отправка...' : 'Проголосовать'}
        </button>
      </form>
    </div>
  );
};

export default VotingStage;

