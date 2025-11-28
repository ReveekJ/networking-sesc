import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizApi, QuizResponse } from '../services/api';
import './JoinQuiz.css';

const JoinQuiz: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuiz = async () => {
      if (!inviteCode) {
        setError('Код приглашения не указан');
        setLoading(false);
        return;
      }

      try {
        const quizData = await quizApi.getQuiz(inviteCode);
        setQuiz(quizData);
      } catch (err) {
        setError('Квиз не найден');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [inviteCode]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="container">
        <div className="error-card">
          <h2>Ошибка</h2>
          <p>{error || 'Квиз не найден'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="join-quiz-card">
        <h1>{quiz.title}</h1>
        <p className="quiz-description">Присоединитесь к квизу, зарегистрировав свою команду</p>
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/register/${inviteCode}`)}
        >
          Зарегистрировать команду
        </button>
      </div>
    </div>
  );
};

export default JoinQuiz;
