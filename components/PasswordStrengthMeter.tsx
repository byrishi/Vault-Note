
import React from 'react';
import { PasswordStrength } from '../types';

interface PasswordStrengthMeterProps {
  strength: PasswordStrength | null;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ strength }) => {
  const strengthBars = Array(4).fill(0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center h-5">
         <span className="text-sm font-medium text-[var(--text-muted-color)]">Password Strength</span>
         {strength && (
            <span className={`text-sm font-bold ${strength.textColor}`}>
                {strength.label}
            </span>
         )}
      </div>
      <div className="w-full grid grid-cols-4 gap-2">
          {strengthBars.map((_, index) => (
              <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                      strength && index < strength.score ? strength.color : 'bg-[var(--card-bg-hover)]'
                  }`}
              ></div>
          ))}
      </div>
       <div className="text-right text-xs text-[var(--text-muted-color)] h-4">
          {strength && strength.timeToCrack && (
              <>
                  Time to crack: <span className="font-semibold text-[var(--text-color)]">{strength.timeToCrack}</span>
              </>
          )}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
