import React from 'react';

const VoiceFeedback = ({ isListening, transcript, feedback }) => {
  if (!feedback.message && !transcript) return null;

  return (
    <div className={`voice-feedback ${feedback.type}`}>
      {isListening && transcript && (
        <div className="transcript">
          <strong>Reconhecendo:</strong> {transcript}
        </div>
      )}
      {feedback.message && (
        <div className="feedback-message">
          {feedback.message}
        </div>
      )}
    </div>
  );
};

export default VoiceFeedback;
