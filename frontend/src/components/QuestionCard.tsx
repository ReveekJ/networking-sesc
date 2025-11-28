import React from 'react';
import { QuestionResponse } from '../services/api';
import './QuestionCard.css';

interface QuestionCardProps {
  question: QuestionResponse;
  questionNumber: number;
  totalQuestions: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
}) => {
  return (
    <div className="question-card">
      <div className="question-header">
        <span className="question-number">
          Вопрос {questionNumber} из {totalQuestions}
        </span>
      </div>
      <h2 className="question-text">{question.text}</h2>
    </div>
  );
};

export default QuestionCard;

