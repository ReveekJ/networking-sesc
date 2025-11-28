import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizApi, QuizResponse, TeamResponse, QuestionResponse } from '../services/api';
import { WebSocketClient } from '../services/websocket';
import TeamList from '../components/TeamList';
import QuestionCard from '../components/QuestionCard';
import './HostDashboard.css';

const HostDashboard: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!inviteCode) return;
      try {
        const [quizData, teamsData] = await Promise.all([
          quizApi.getQuiz(inviteCode),
          quizApi.getTeams(inviteCode),
        ]);
        setQuiz(quizData);
        setTeams(teamsData);

        if (quizData.status === 'in_progress') {
          try {
            const question = await quizApi.getCurrentQuestion(inviteCode);
            setCurrentQuestion(question);
          } catch (error) {
            console.error('Error loading current question:', error);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [inviteCode]);

  useEffect(() => {
    if (!inviteCode) return;

    const client = new WebSocketClient(inviteCode);
    client.onMessage((message) => {
      if (message.type === 'team_joined') {
        // Reload teams
        quizApi.getTeams(inviteCode).then(setTeams);
      } else if (message.type === 'question_changed') {
        // Reload current question
        quizApi.getCurrentQuestion(inviteCode).then(setCurrentQuestion);
      }
    });

    client.connect().then(() => {
      setWsClient(client);
    }).catch((error) => {
      console.error('WebSocket connection error:', error);
    });

    return () => {
      client.disconnect();
    };
  }, [inviteCode]);

  const handleStartQuiz = async () => {
    if (!inviteCode) return;
    setActionLoading(true);
    try {
      await quizApi.startQuiz(inviteCode);
      const quizData = await quizApi.getQuiz(inviteCode);
      setQuiz(quizData);
      if (quizData.status === 'in_progress') {
        const question = await quizApi.getCurrentQuestion(inviteCode);
        setCurrentQuestion(question);
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Ошибка при запуске квиза');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!inviteCode) return;
    setActionLoading(true);
    try {
      await quizApi.nextQuestion(inviteCode);
      const quizData = await quizApi.getQuiz(inviteCode);
      setQuiz(quizData);
      
      if (quizData.status === 'completed') {
        navigate(`/statistics/${inviteCode}`);
      } else {
        const question = await quizApi.getCurrentQuestion(inviteCode);
        setCurrentQuestion(question);
      }
    } catch (error) {
      console.error('Error moving to next question:', error);
      alert('Ошибка при переходе к следующему вопросу');
    } finally {
      setActionLoading(false);
    }
  };

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

  if (!quiz) {
    return (
      <div className="container">
        <div className="error-card">
          <h2>Квиз не найден</h2>
        </div>
      </div>
    );
  }

  const questionIndex = currentQuestion
    ? quiz.questions.findIndex((q) => q.id === currentQuestion.id)
    : -1;
  const totalQuestions = quiz.questions.length;

  return (
    <div className="container">
      <div className="host-dashboard-header">
        <h1>{quiz.title}</h1>
        <p className="quiz-status">Статус: {quiz.status}</p>
      </div>

      <div className="host-dashboard-content">
        <div className="teams-section">
          <div className="section-header">
            <h2>Команды ({teams.length})</h2>
          </div>
          <TeamList teams={teams} />
        </div>

        <div className="quiz-control-section">
          {quiz.status === 'waiting' || quiz.status === 'draft' ? (
            <div className="control-card">
              <h2>Управление квизом</h2>
              <p>Зарегистрировалось команд: {teams.length}</p>
              <button
                className="btn btn-primary"
                onClick={handleStartQuiz}
                disabled={actionLoading || teams.length === 0}
              >
                {actionLoading ? 'Запуск...' : 'Запустить квиз'}
              </button>
            </div>
          ) : quiz.status === 'in_progress' && currentQuestion ? (
            <div className="control-card">
              <h2>Текущий вопрос</h2>
              <QuestionCard
                question={currentQuestion}
                questionNumber={questionIndex + 1}
                totalQuestions={totalQuestions}
              />
              <button
                className="btn btn-primary"
                onClick={handleNextQuestion}
                disabled={actionLoading}
              >
                {actionLoading ? 'Переход...' : 'Следующий вопрос'}
              </button>
            </div>
          ) : (
            <div className="control-card">
              <h2>Квиз завершен</h2>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/statistics/${inviteCode}`)}
              >
                Посмотреть статистику
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;
