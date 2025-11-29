import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './QRCodeDisplay.css';

const QRCodeDisplay = ({ qrCodeData, inviteCode }) => {
  const inviteUrl = `${window.location.origin}/survey/${inviteCode}`;

  const handleDownload = () => {
    const svg = document.getElementById('qrcode-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `survey-qr-${inviteCode}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="qr-code-display">
      <h4>QR код для опроса</h4>
      <div className="qr-container">
        <QRCodeSVG
          id="qrcode-svg"
          value={inviteUrl}
          size={256}
          level="H"
          includeMargin={true}
        />
      </div>
      <button className="button" onClick={handleDownload}>
        Скачать QR код
      </button>
    </div>
  );
};

export default QRCodeDisplay;

