import React, { useState } from 'react';
import './TextInputAnswer.css';

interface TextInputAnswerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const TextInputAnswer: React.FC<TextInputAnswerProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="text-input-answer">
      <textarea
        className="form-input answer-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Введите ваш ответ..."
        rows={6}
        disabled={disabled}
      />
      <button
        type="submit"
        className="btn btn-primary"
        disabled={disabled || !value.trim()}
      >
        Отправить ответ
      </button>
    </form>
  );
};

export default TextInputAnswer;

