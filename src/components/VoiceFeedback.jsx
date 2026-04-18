import React from 'react';

const VoiceFeedback = ({ isListening, transcript, feedback }) => {
  if (!isListening && !feedback) return null;

  const type = feedback ? feedback.type : 'info';
  const message = feedback ? feedback.message : 'Ouvindo...';

  return (
    <div className={`voice-feedback ${type}`}>
      {transcript && isListening && (
        <p className="transcript">"{transcript}"</p>
      )}
      <p className="feedback-message">{message}</p>
    </div>
  );
};

export default VoiceFeedback;
