import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizApi, TeamCreate, ParticipantCreate, QuizResponse } from '../services/api';
import ParticipantForm from '../components/ParticipantForm';
import './TeamRegistration.css';

const TeamRegistration: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [teamName, setTeamName] = useState('');
  const [participants, setParticipants] = useState<ParticipantCreate[]>([
    { first_name: '', last_name: '', contact_info: {}, profession: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadQuiz = async () => {
      if (!inviteCode) return;
      try {
        const quizData = await quizApi.getQuiz(inviteCode);
        setQuiz(quizData);
      } catch (error) {
        console.error('Error loading quiz:', error);
      }
    };
    loadQuiz();
  }, [inviteCode]);

  const addParticipant = () => {
    setParticipants([
      ...participants,
      { first_name: '', last_name: '', contact_info: {}, profession: '' },
    ]);
  };

  const updateParticipant = (index: number, participant: ParticipantCreate) => {
    const newParticipants = [...participants];
    newParticipants[index] = participant;
    setParticipants(newParticipants);
  };

  const deleteParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      alert('Введите название команды');
      return;
    }

    if (participants.length === 0) {
      alert('Добавьте хотя бы одного участника');
      return;
    }

    // Validate participants
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      if (!p.first_name.trim() || !p.last_name.trim()) {
        alert(`Участник ${i + 1}: заполните имя и фамилию`);
        return;
      }
    }

    if (!inviteCode) return;

    setSubmitting(true);
    try {
      const team = await quizApi.createTeam(inviteCode, {
        name: teamName,
        participants: participants.map((p) => ({
          ...p,
          contact_info: Object.keys(p.contact_info || {}).length > 0 ? p.contact_info : undefined,
          profession: p.profession?.trim() || undefined,
        })),
      });

      // Navigate to quiz player for first participant
      if (team.participants.length > 0) {
        navigate(`/play/${inviteCode}/${team.participants[0].id}`);
      }
    } catch (error: any) {
      console.error('Error creating team:', error);
      alert(error.response?.data?.detail || 'Ошибка при регистрации команды');
    } finally {
      setSubmitting(false);
    }
  };

  if (!quiz) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="team-registration-header">
        <h1>Регистрация команды</h1>
        <p className="subtitle">Квиз: {quiz.title}</p>
      </div>

      <form onSubmit={handleSubmit} className="team-registration-form">
        <div className="card">
          <div className="form-group">
            <label className="form-label">Название команды *</label>
            <input
              type="text"
              className="form-input"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Введите название команды"
              required
            />
            <p className="form-hint">
              Название должно отражать цель, задачу или специфику вашей команды
            </p>
          </div>
        </div>

        <div className="participants-section">
          <div className="participants-header">
            <h2>Участники команды</h2>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addParticipant}
            >
              + Добавить участника
            </button>
          </div>

          {participants.map((participant, index) => (
            <ParticipantForm
              key={index}
              participant={participant}
              index={index}
              onChange={(p) => updateParticipant(index, p)}
              onDelete={() => deleteParticipant(index)}
            />
          ))}
        </div>

        <div className="submit-section">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Регистрация...' : 'Зарегистрировать команду'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeamRegistration;
