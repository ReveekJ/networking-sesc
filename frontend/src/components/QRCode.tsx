import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './QRCode.css';

interface QRCodeProps {
  value: string;
  size?: number;
}

const QRCode: React.FC<QRCodeProps> = ({ value, size = 200 }) => {
  return (
    <div className="qr-code-container">
      <QRCodeSVG value={value} size={size} />
    </div>
  );
};

export default QRCode;

