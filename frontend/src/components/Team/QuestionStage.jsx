import React, { useState } from 'react';
import { teamApi } from '../../services/api';
import './QuestionStage.css';

const QuestionStage = ({ teamId, onComplete }) => {
  const [answers, setAnswers] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addAnswerField = () => {
    setAnswers([...answers, '']);
  };

  const removeAnswerField = (index) => {
    if (answers.length > 1) {
      setAnswers(answers.filter((_, i) => i !== index));
    }
  };

  const updateAnswer = (index, value) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validAnswers = answers.filter(a => a.trim() !== '');
    if (validAnswers.length === 0) {
      setError('Добавьте хотя бы один вариант ответа');
      setLoading(false);
      return;
    }

    try {
      await teamApi.submitAnswers(teamId, validAnswers);
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при отправке ответов');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="question-stage">
      <h2>Вопрос</h2>
      <p className="question-text">
        Какие направления развития и использования средств целевого капитала вы предлагаете?
      </p>

      <form onSubmit={handleSubmit}>
        <div className="answers-section">
          <label className="label">Варианты ответов</label>
          {answers.map((answer, index) => (
            <div key={index} className="answer-field">
              <input
                type="text"
                className="input"
                value={answer}
                onChange={(e) => updateAnswer(index, e.target.value)}
                placeholder={`Вариант ${index + 1}`}
              />
              {answers.length > 1 && (
                <button
                  type="button"
                  className="button-remove"
                  onClick={() => removeAnswerField(index)}
                >
                  Удалить
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="button button-secondary"
            onClick={addAnswerField}
          >
            + Добавить вариант
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Отправка...' : 'Отправить ответы'}
        </button>
      </form>
    </div>
  );
};

export default QuestionStage;

