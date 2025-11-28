import React, { useState } from 'react';
import QRCode from './QRCode';
import './InviteLink.css';

interface InviteLinkProps {
  inviteCode: string;
}

const InviteLink: React.FC<InviteLinkProps> = ({ inviteCode }) => {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}/join/${inviteCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="invite-link-container">
      <div className="invite-link-card">
        <h3>Ссылка-приглашение</h3>
        <div className="invite-link-input-group">
          <input
            type="text"
            className="form-input invite-link-input"
            value={inviteUrl}
            readOnly
          />
          <button
            type="button"
            className={`btn btn-primary ${copied ? 'copied' : ''}`}
            onClick={copyToClipboard}
          >
            {copied ? '✓ Скопировано' : 'Копировать'}
          </button>
        </div>
      </div>

      <div className="qr-code-card">
        <h3>QR код</h3>
        <QRCode value={inviteUrl} size={200} />
        <p className="qr-code-hint">Отсканируйте QR код для присоединения к квизу</p>
      </div>
    </div>
  );
};

export default InviteLink;

