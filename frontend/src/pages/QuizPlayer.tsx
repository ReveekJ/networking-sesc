import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizApi, QuestionResponse, AnswerCreate, StatisticsResponse } from '../services/api';
import { WebSocketClient } from '../services/websocket';
import QuestionCard from '../components/QuestionCard';
import TextInputAnswer from '../components/TextInputAnswer';
import MultipleChoiceAnswer from '../components/MultipleChoiceAnswer';
import './QuizPlayer.css';

const QuizPlayer: React.FC = () => {
  const { inviteCode, participantId } = useParams<{ inviteCode: string; participantId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionResponse | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [textAnswer, setTextAnswer] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);
  const [quizStatus, setQuizStatus] = useState<string>('waiting');
  const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);
  const [loadingStatistics, setLoadingStatistics] = useState(false);

  const loadCurrentQuestion = async (quizData?: any) => {
    if (!inviteCode) return;
    try {
      const question = await quizApi.getCurrentQuestion(inviteCode);
      setCurrentQuestion(question);
      
      // Clear statistics if not the last question
      if (!question.is_last) {
        setStatistics(null);
        setLoadingStatistics(false);
      }
      
      // Find question index
      const quizToUse = quizData || quiz;
      if (quizToUse) {
        const index = quizToUse.questions.findIndex((q: QuestionResponse) => q.id === question.id);
        setQuestionIndex(index);
      }
    } catch (error) {
      console.error('Error loading current question:', error);
    }
  };

  useEffect(() => {
    const loadQuiz = async () => {
      if (!inviteCode) return;
      try {
        const quizData = await quizApi.getQuiz(inviteCode);
        setQuiz(quizData);
        setQuizStatus(quizData.status);

        if (quizData.status === 'in_progress') {
          await loadCurrentQuestion(quizData);
        }
      } catch (error) {
        console.error('Error loading quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [inviteCode]);

  useEffect(() => {
    if (!inviteCode) return;

    const client = new WebSocketClient(inviteCode);
    client.onMessage((message) => {
      if (message.type === 'quiz_started') {
        setQuizStatus('in_progress');
        loadCurrentQuestion();
      } else if (message.type === 'question_changed') {
        setSubmitted(false);
        setTextAnswer('');
        setSelectedOptions([]);
        setStatistics(null);
        setLoadingStatistics(false);
        loadCurrentQuestion();
      } else if (message.type === 'quiz_completed') {
        setQuizStatus('completed');
        navigate(`/statistics/${inviteCode}`);
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

  const handleSubmitAnswer = async () => {
    if (!inviteCode || !participantId || !currentQuestion) return;

    const answerData: AnswerCreate = {
      question_id: currentQuestion.id,
    };

    if (currentQuestion.type === 'text_input') {
      answerData.text_answer = textAnswer;
    } else {
      answerData.selected_options = selectedOptions;
    }

    try {
      await quizApi.submitAnswer(inviteCode, participantId, answerData);
      setSubmitted(true);

      // If this is the last question, load statistics
      if (currentQuestion.is_last) {
        setLoadingStatistics(true);
        try {
          const stats = await quizApi.getStatistics(inviteCode);
          setStatistics(stats);
        } catch (error) {
          console.error('Error loading statistics:', error);
        } finally {
          setLoadingStatistics(false);
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Ошибка при отправке ответа');
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

  if (quizStatus === 'waiting' || quizStatus === 'draft') {
    return (
      <div className="container">
        <div className="waiting-card">
          <h2>Ожидание начала квиза</h2>
          <p>Квиз еще не начался. Дождитесь начала от организатора.</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="container">
        <div className="error-card">
          <h2>Вопрос не найден</h2>
        </div>
      </div>
    );
  }

  const totalQuestions = quiz?.questions?.length || 0;

  return (
    <div className="container">
      <div className="quiz-player-header">
        <h1>{quiz?.title}</h1>
      </div>

      <QuestionCard
        question={currentQuestion}
        questionNumber={questionIndex + 1}
        totalQuestions={totalQuestions}
      />

      {submitted ? (
        <>
          {currentQuestion.is_last && statistics ? (
            <div className="statistics-container">
              <div className="answer-submitted-card">
                <p>✓ Ваш ответ отправлен</p>
              </div>
              <div className="statistics-content">
                <h2 className="statistics-title">{statistics.question_text}</h2>
                <p className="total-answers">
                  Всего ответов: {statistics.total_answers}
                </p>
                {statistics.options.map((option) => {
                  const maxCount = Math.max(...statistics.options.map((opt) => opt.count), 1);
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
          ) : currentQuestion.is_last && loadingStatistics ? (
            <div className="answer-submitted-card">
              <p>✓ Ваш ответ отправлен</p>
              <p className="waiting-text">Загрузка статистики...</p>
            </div>
          ) : (
            <div className="answer-submitted-card">
              <p>✓ Ваш ответ отправлен</p>
              <p className="waiting-text">Ожидайте следующего вопроса...</p>
            </div>
          )}
        </>
      ) : (
        <>
          {currentQuestion.type === 'text_input' ? (
            <TextInputAnswer
              value={textAnswer}
              onChange={setTextAnswer}
              onSubmit={handleSubmitAnswer}
            />
          ) : (
            <MultipleChoiceAnswer
              options={currentQuestion.options}
              selectedOptions={selectedOptions}
              onChange={setSelectedOptions}
              onSubmit={handleSubmitAnswer}
            />
          )}
        </>
      )}
    </div>
  );
};

export default QuizPlayer;
