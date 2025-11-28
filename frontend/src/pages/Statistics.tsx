import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { quizApi, StatisticsResponse } from '../services/api';
import './Statistics.css';

const Statistics: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStatistics = async () => {
      if (!inviteCode) return;
      try {
        const stats = await quizApi.getStatistics(inviteCode);
        setStatistics(stats);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Ошибка при загрузке статистики');
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, [inviteCode]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="container">
        <div className="error-card">
          <h2>Ошибка</h2>
          <p>{error || 'Статистика недоступна'}</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...statistics.options.map((opt) => opt.count), 1);

  return (
    <div className="container">
      <div className="statistics-header">
        <h1>Статистика</h1>
        <h2 className="question-title">{statistics.question_text}</h2>
        <p className="total-answers">
          Всего ответов: {statistics.total_answers}
        </p>
      </div>

      <div className="statistics-content">
        {statistics.options.map((option) => {
          const percentage = maxCount > 0 ? (option.count / maxCount) * 100 : 0;
          return (
            <div key={option.option_id} className="statistics-item">
              <div className="statistics-item-header">
                <span className="option-text">{option.option_text}</span>
                <span className="option-count">
                  {option.count} ({option.percentage}%)
                </span>
              </div>
              <div className="statistics-bar-container">
                <div
                  className="statistics-bar"
                  style={{ width: `${percentage}%` }}
                >
                  <div className="statistics-bar-fill"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Statistics;
