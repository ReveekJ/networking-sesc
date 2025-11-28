import React, { useState } from 'react';
import { ParticipantCreate } from '../services/api';
import './ParticipantForm.css';

interface ParticipantFormProps {
  participant: ParticipantCreate;
  index: number;
  onChange: (participant: ParticipantCreate) => void;
  onDelete: () => void;
}

const ParticipantForm: React.FC<ParticipantFormProps> = ({
  participant,
  index,
  onChange,
  onDelete,
}) => {
  const [contactInfo, setContactInfo] = useState({
    phone: participant.contact_info?.phone || '',
    email: participant.contact_info?.email || '',
  });

  const updateContactInfo = (field: string, value: string) => {
    const newContactInfo = { ...contactInfo, [field]: value };
    setContactInfo(newContactInfo);
    onChange({
      ...participant,
      contact_info: newContactInfo,
    });
  };

  return (
    <div className="participant-form-card">
      <div className="participant-form-header">
        <h4>Участник {index + 1}</h4>
        <button type="button" className="btn-delete-small" onClick={onDelete}>
          ×
        </button>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Фамилия *</label>
          <input
            type="text"
            className="form-input"
            value={participant.last_name}
            onChange={(e) => onChange({ ...participant, last_name: e.target.value })}
            placeholder="Введите фамилию"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Имя *</label>
          <input
            type="text"
            className="form-input"
            value={participant.first_name}
            onChange={(e) => onChange({ ...participant, first_name: e.target.value })}
            placeholder="Введите имя"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Чем занимается</label>
        <input
          type="text"
          className="form-input"
          value={participant.profession || ''}
          onChange={(e) => onChange({ ...participant, profession: e.target.value })}
          placeholder="Профессия, должность, область деятельности"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Телефон</label>
          <input
            type="tel"
            className="form-input"
            value={contactInfo.phone}
            onChange={(e) => updateContactInfo('phone', e.target.value)}
            placeholder="+7 (999) 123-45-67"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            value={contactInfo.email}
            onChange={(e) => updateContactInfo('email', e.target.value)}
            placeholder="example@mail.com"
          />
        </div>
      </div>
    </div>
  );
};

export default ParticipantForm;

