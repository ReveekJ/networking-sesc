import React, { useState } from 'react';
import { QuestionOptionResponse } from '../services/api';
import './MultipleChoiceAnswer.css';

interface MultipleChoiceAnswerProps {
  options: QuestionOptionResponse[];
  selectedOptions: string[];
  onChange: (selectedOptions: string[]) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const MultipleChoiceAnswer: React.FC<MultipleChoiceAnswerProps> = ({
  options,
  selectedOptions,
  onChange,
  onSubmit,
  disabled = false,
}) => {
  const handleOptionToggle = (optionId: string) => {
    if (disabled) return;

    if (selectedOptions.includes(optionId)) {
      onChange(selectedOptions.filter((id) => id !== optionId));
    } else {
      onChange([...selectedOptions, optionId]);
    }
  };

  const handleSubmit = () => {
    if (selectedOptions.length > 0) {
      onSubmit();
    }
  };

  return (
    <div className="multiple-choice-answer">
      <div className="options-list">
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              className={`option-button ${isSelected ? 'selected' : ''}`}
              onClick={() => handleOptionToggle(option.id)}
              disabled={disabled}
            >
              <span className="option-checkbox">
                {isSelected && '✓'}
              </span>
              <span className="option-text">{option.text}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={disabled || selectedOptions.length === 0}
      >
        Отправить ответ
      </button>
    </div>
  );
};

export default MultipleChoiceAnswer;

