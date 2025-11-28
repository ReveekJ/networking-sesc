import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizApi, QuestionCreate } from '../services/api';
import QuestionForm from '../components/QuestionForm';
import InviteLink from '../components/InviteLink';
import './CreateQuiz.css';

const CreateQuiz: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<QuestionCreate[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const addQuestion = () => {
    const newQuestion: QuestionCreate = {
      text: '',
      order: questions.length,
      type: 'text_input',  // All questions are text_input
      is_last: false,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, question: QuestionCreate) => {
    const newQuestions = [...questions];
    // Force type to be text_input
    newQuestions[index] = { ...question, type: 'text_input', order: index, is_last: false };
    setQuestions(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i }));
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Введите название квиза');
      return;
    }

    if (questions.length === 0) {
      alert('Добавьте хотя бы один вопрос');
      return;
    }

    // Validate questions - all must be text_input
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        alert(`Вопрос ${i + 1}: введите текст вопроса`);
        return;
      }
    }

    setLoading(true);
    try {
      const quiz = await quizApi.createQuiz({
        title,
        questions: questions.map((q, i) => ({
          text: q.text,
          order: i,
          type: 'text_input',  // All questions are text_input
          is_last: false,
        })),
      });
      setInviteCode(quiz.invite_code);
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Ошибка при создании квиза');
    } finally {
      setLoading(false);
    }
  };

  if (inviteCode) {
    return (
      <div className="container">
        <div className="success-card">
          <h1>Квиз создан успешно!</h1>
          <InviteLink inviteCode={inviteCode} />
          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/host/${inviteCode}`)}
            >
              Перейти к управлению квизом
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
              setInviteCode(null);
              setTitle('');
              setQuestions([]);
              }}
            >
              Создать новый квиз
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="create-quiz-header">
        <h1>Создание квиза</h1>
        <p className="subtitle">Создайте квиз с вопросами для команд</p>
      </div>

      <form onSubmit={handleSubmit} className="create-quiz-form">
        <div className="card">
          <div className="form-group">
            <label className="form-label">Название квиза</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название квиза"
              required
            />
          </div>
        </div>

        <div className="questions-section">
          <div className="questions-header">
            <h2>Вопросы</h2>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addQuestion}
            >
              + Добавить вопрос
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="empty-state">
              <p>Добавьте вопросы к квизу</p>
            </div>
          ) : (
            questions.map((question, index) => (
              <QuestionForm
                key={index}
                question={question}
                index={index}
                onChange={(q) => updateQuestion(index, q)}
                onDelete={() => deleteQuestion(index)}
              />
            ))
          )}
        </div>

        <div className="submit-section">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || questions.length === 0}
          >
            {loading ? 'Создание...' : 'Создать квиз'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuiz;
