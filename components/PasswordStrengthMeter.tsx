import React from 'react';
import { PasswordStrength } from '../types';

interface PasswordStrengthMeterProps {
  strength: PasswordStrength | null;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ strength }) => (
  <div className="strength-meter" aria-live="polite">
    <div className="strength-heading"><span>Password strength</span><strong>{strength?.label || 'Generate to check'}</strong></div>
    <div className="strength-bars" aria-label={strength ? 'Strength score ' + strength.score + ' out of 4' : 'No password generated'}>
      {Array.from({ length: 4 }, (_, index) => <span key={index} className={'strength-bar' + (strength && index < strength.score ? ' is-filled' + (strength.score < 3 ? ' is-weak' : '') : '')} />)}
    </div>
    <div className="strength-note">{strength?.timeToCrack ? <>Estimated crack time: <strong>{strength.timeToCrack}</strong></> : 'Calculated locally from the selected character types'}</div>
  </div>
);

export default PasswordStrengthMeter;
