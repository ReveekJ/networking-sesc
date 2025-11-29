import React from 'react';
import './ParticipantForm.css';

const ParticipantForm = ({ index, participant, onUpdate, onRemove, canRemove }) => {
  return (
    <div className="participant-form">
      <div className="participant-header">
        <h4>Участник {index + 1}</h4>
        {canRemove && (
          <button type="button" className="button-remove" onClick={onRemove}>
            Удалить
          </button>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="label">Фамилия *</label>
          <input
            type="text"
            className="input"
            value={participant.last_name}
            onChange={(e) => onUpdate('last_name', e.target.value)}
            placeholder="Введите фамилию"
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Имя *</label>
          <input
            type="text"
            className="input"
            value={participant.first_name}
            onChange={(e) => onUpdate('first_name', e.target.value)}
            placeholder="Введите имя"
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="label">Телефон</label>
          <input
            type="tel"
            className="input"
            value={participant.contact_info.phone || ''}
            onChange={(e) => onUpdate('contact_info.phone', e.target.value)}
            placeholder="+7 (999) 123-45-67"
          />
        </div>

        <div className="form-group">
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={participant.contact_info.email || ''}
            onChange={(e) => onUpdate('contact_info.email', e.target.value)}
            placeholder="example@mail.com"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="label">Чем занимается (профессия, должность, область деятельности) *</label>
        <input
          type="text"
          className="input"
          value={participant.profession}
          onChange={(e) => onUpdate('profession', e.target.value)}
          placeholder="Например: Разработчик, Менеджер проектов"
          required
        />
      </div>
    </div>
  );
};

export default ParticipantForm;

