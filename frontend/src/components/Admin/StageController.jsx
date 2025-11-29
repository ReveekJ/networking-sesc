import React from 'react';
import './StageController.css';

const StageController = ({ currentStage, surveyStatus, onStart, onNextStage, loading }) => {
  const stages = [
    { key: 'question', label: 'Вопрос', description: 'Команды предлагают варианты ответов' },
    { key: 'voting', label: 'Голосование', description: 'Команды голосуют за варианты' },
    { key: 'results', label: 'Результаты', description: 'Просмотр статистики' }
  ];

  const currentStageIndex = stages.findIndex(s => s.key === currentStage);

  return (
    <div className="stage-controller">
      <h3>Управление этапами опроса</h3>
      <div className="stages-indicator">
        {stages.map((stage, index) => (
          <div
            key={stage.key}
            className={`stage-item ${index === currentStageIndex ? 'active' : ''} ${index < currentStageIndex ? 'completed' : ''}`}
          >
            <div className="stage-number">{index + 1}</div>
            <div className="stage-info">
              <div className="stage-label">{stage.label}</div>
              <div className="stage-description">{stage.description}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="stage-actions">
        {surveyStatus === 'draft' && (
          <button className="button" onClick={onStart} disabled={loading}>
            Начать опрос
          </button>
        )}
        {surveyStatus === 'active' && currentStageIndex < stages.length - 1 && (
          <button className="button" onClick={onNextStage} disabled={loading}>
            Следующий этап
          </button>
        )}
        {currentStageIndex === stages.length - 1 && (
          <div className="completed-message">Опрос завершен</div>
        )}
      </div>
    </div>
  );
};

export default StageController;

