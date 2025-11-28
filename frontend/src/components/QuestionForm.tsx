import React from 'react';
import { QuestionCreate } from '../services/api';
import './QuestionForm.css';

interface QuestionFormProps {
  question: QuestionCreate;
  index: number;
  onChange: (question: QuestionCreate) => void;
  onDelete: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  question,
  index,
  onChange,
  onDelete,
}) => {
  return (
    <div className="question-form-card">
      <div className="question-form-header">
        <h3>Вопрос {index + 1}</h3>
        <button type="button" className="btn-delete" onClick={onDelete}>
          Удалить
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">Текст вопроса</label>
        <textarea
          className="form-input"
          value={question.text}
          onChange={(e) => onChange({ ...question, text: e.target.value, type: 'text_input', is_last: false })}
          placeholder="Введите текст вопроса"
          rows={3}
        />
      </div>

      <div className="form-group">
        <p className="form-hint">
          Все вопросы текстовые. Последний вопрос с мультивыбором будет автоматически создан из ответов участников.
        </p>
      </div>
    </div>
  );
};

export default QuestionForm;

