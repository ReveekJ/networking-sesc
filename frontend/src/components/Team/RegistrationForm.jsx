import React, { useState } from 'react';
import ParticipantForm from './ParticipantForm';
import { teamApi } from '../../services/api';
import './RegistrationForm.css';

const RegistrationForm = ({ inviteCode, onRegistered }) => {
  const [teamName, setTeamName] = useState('');
  const [participants, setParticipants] = useState([{ first_name: '', last_name: '', contact_info: { phone: '', email: '' }, profession: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addParticipant = () => {
    setParticipants([...participants, { first_name: '', last_name: '', contact_info: { phone: '', email: '' }, profession: '' }]);
  };

  const removeParticipant = (index) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index, field, value) => {
    const updated = [...participants];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[index][parent][child] = value;
    } else {
      updated[index][field] = value;
    }
    setParticipants(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate
    if (!teamName.trim()) {
      setError('Введите название команды');
      setLoading(false);
      return;
    }

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      if (!p.first_name.trim() || !p.last_name.trim() || !p.profession.trim()) {
        setError(`Заполните все поля для участника ${i + 1}`);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await teamApi.registerTeam({
        survey_invite_code: inviteCode,
        team_name: teamName,
        participants: participants.map(p => ({
          first_name: p.first_name,
          last_name: p.last_name,
          contact_info: p.contact_info,
          profession: p.profession
        }))
      });
      
      if (onRegistered) {
        onRegistered(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при регистрации команды');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-form">
      <h2>Регистрация команды</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label className="label">Название команды *</label>
          <input
            type="text"
            className="input"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Введите название команды"
            required
          />
        </div>

        <div className="participants-section">
          <div className="section-header">
            <h3>Участники команды</h3>
            <button type="button" className="button button-secondary" onClick={addParticipant}>
              + Добавить участника
            </button>
          </div>

          {participants.map((participant, index) => (
            <ParticipantForm
              key={index}
              index={index}
              participant={participant}
              onUpdate={(field, value) => updateParticipant(index, field, value)}
              onRemove={() => removeParticipant(index)}
              canRemove={participants.length > 1}
            />
          ))}
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>
    </div>
  );
};

export default RegistrationForm;

