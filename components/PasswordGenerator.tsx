
import React, { useState, useEffect, useCallback } from 'react';
import ClipboardIcon from './icons/ClipboardIcon';
import SparklesIcon from './icons/SparklesIcon';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import { PasswordStrength } from '../types';

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

// Helper for cryptographically secure random numbers
const secureRandom = (max: number): number => {
    const randomValues = new Uint32Array(1);
    window.crypto.getRandomValues(randomValues);
    return randomValues[0] % max;
}

const formatTimeToCrack = (combinations: number): string => {
    // Assumption: A powerful attacker can try 10 trillion (10^13) passwords per second.
    const guessesPerSecond = 1e13;
    const seconds = combinations / guessesPerSecond;

    if (!isFinite(seconds) || seconds > 3.15e28 /* > 1 nonillion years */) return 'an eternity';
    if (seconds < 0.01) return 'instantly';
    if (seconds < 60) return `${Math.max(1, Math.round(seconds))} seconds`;
    
    const minutes = seconds / 60;
    if (minutes < 60) return `${Math.round(minutes)} minutes`;
    
    const hours = minutes / 60;
    if (hours < 24) return `${Math.round(hours)} hours`;

    const days = hours / 24;
    if (days < 365.25) return `${Math.round(days)} days`;

    const years = days / 365.25;
    const yearSuffixes = [
        { value: 1e24, symbol: 'septillion' },
        { value: 1e21, symbol: 'sextillion' },
        { value: 1e18, symbol: 'quintillion' },
        { value: 1e15, symbol: 'quadrillion' },
        { value: 1e12, symbol: 'trillion' },
        { value: 1e9,  symbol: 'billion' },
        { value: 1e6,  symbol: 'million' },
        { value: 1e3,  symbol: 'thousand' },
    ];
    
    for (const { value, symbol } of yearSuffixes) {
        if (years >= value) {
            return `${Math.floor(years / value).toLocaleString()} ${symbol} years`;
        }
    }
    
    return `${Math.floor(years).toLocaleString()} years`;
};

const PasswordGenerator: React.FC = () => {
  const [password, setPassword] = useState('CLICK-GENERATE');
  const [displayedPassword, setDisplayedPassword] = useState('CLICK-GENERATE');
  const [isGenerating, setIsGenerating] = useState(false);
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState<PasswordStrength | null>(null);

  useEffect(() => {
    if (password === 'CLICK-GENERATE' || !isGenerating) {
      setDisplayedPassword(password);
      return;
    }

    let i = 0;
    setDisplayedPassword('');
    const intervalId = setInterval(() => {
      setDisplayedPassword(prev => prev + password.charAt(i));
      i++;
      if (i >= password.length) {
        clearInterval(intervalId);
        setIsGenerating(false);
      }
    }, 50);

    return () => clearInterval(intervalId);
  }, [password, isGenerating]);
  
  useEffect(() => {
    // When length changes, the old password/strength is invalid.
    setStrength(null);
  }, [length]);

  const calculateStrength = useCallback((pass: string, opts: typeof options): PasswordStrength | null => {
    if (!pass || pass === 'CLICK-GENERATE' || pass === 'SELECT-OPTIONS') {
        return null;
    }

    let charPool = 0;
    if (opts.uppercase) charPool += CHARSETS.uppercase.length;
    if (opts.lowercase) charPool += CHARSETS.lowercase.length;
    if (opts.numbers) charPool += CHARSETS.numbers.length;
    if (opts.symbols) charPool += CHARSETS.symbols.length;

    if (charPool === 0) return null;

    const entropy = pass.length * Math.log2(charPool);
    const combinations = Math.pow(2, entropy);
    const timeToCrack = formatTimeToCrack(combinations);

    if (entropy < 35) return { score: 1, label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-500', timeToCrack };
    if (entropy < 60) return { score: 2, label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-500', timeToCrack };
    if (entropy < 100) return { score: 3, label: 'Strong', color: 'bg-green-400', textColor: 'text-green-400', timeToCrack };
    return { score: 4, label: 'Very Strong', color: 'bg-green-600', textColor: 'text-green-600', timeToCrack };
  }, []);

  const handleGeneratePassword = useCallback(() => {
    const selectedCharsets = Object.entries(options)
      .filter(([, isEnabled]) => isEnabled)
      .map(([type]) => CHARSETS[type as keyof typeof CHARSETS]);

    if (selectedCharsets.length === 0) {
      setPassword('SELECT-OPTIONS');
      setIsGenerating(false);
      setStrength({ score: 0, label: 'Select options', color: '', textColor: 'text-[var(--warning-text)]', timeToCrack: 'N/A' });
      return;
    }
    
    const allChars = selectedCharsets.join('');
    let newPassword = '';
    
    // Ensure at least one char from each selected set
    selectedCharsets.forEach(charset => {
        newPassword += charset.charAt(secureRandom(charset.length));
    });

    // Fill the rest of the password length
    const remainingLength = length - newPassword.length;
    for (let i = 0; i < remainingLength; i++) {
        newPassword += allChars.charAt(secureRandom(allChars.length));
    }
    
    // Securely shuffle the password to randomize character positions (Fisher-Yates shuffle)
    const array = newPassword.split('');
    for (let i = array.length - 1; i > 0; i--) {
        const j = secureRandom(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    newPassword = array.join('');

    setPassword(newPassword);
    setIsGenerating(true);
    setStrength(calculateStrength(newPassword, options));
  }, [length, options, calculateStrength]);
  
  const handleCopy = useCallback(() => {
    if (password && password !== 'CLICK-GENERATE' && password !== 'SELECT-OPTIONS') {
        navigator.clipboard.writeText(password).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }
  }, [password]);

  const handleOptionChange = (option: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [option]: !prev[option] }));
    setStrength(null);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
        <div className="relative w-full bg-[var(--card-bg)] backdrop-blur-lg border border-[var(--ring-color)] rounded-lg p-4 flex items-center justify-between">
            <code className="text-xl sm:text-2xl text-[var(--text-strong)] font-mono break-all flex-1 tracking-wider">
                {displayedPassword}
                {isGenerating && <span className="password-display-cursor" />}
            </code>
            <button
                onClick={handleCopy}
                className="p-2 rounded-md bg-[var(--card-bg-hover)] text-[var(--text-muted-color)] hover:text-[var(--text-strong)] transition-all duration-300 ease-in-out ml-4"
                title="Copy Password"
            >
                <ClipboardIcon className="w-5 h-5"/>
            </button>
            {copied && <div className="absolute -top-3 right-3 text-[var(--success-text)] text-xs px-2 py-0.5 rounded font-sans bg-[var(--success-bg)] animate-fade-in">Copied!</div>}
        </div>

        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <label htmlFor="length" className="font-semibold text-[var(--text-color)]">Password Length</label>
                    <span className="text-lg font-mono text-[var(--accent-color)]">{length}</span>
                </div>
                <input
                    id="length"
                    type="range"
                    min="8"
                    max="64"
                    value={length}
                    onChange={(e) => setLength(Number(e.target.value))}
                    className="w-full h-2 bg-[var(--card-bg-hover)] rounded-lg appearance-none cursor-pointer"
                />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.keys(CHARSETS).map((opt) => (
                    <label key={opt} className="flex items-center space-x-3 cursor-pointer hacker-checkbox">
                        <input
                            type="checkbox"
                            checked={options[opt as keyof typeof options]}
                            onChange={() => handleOptionChange(opt as keyof typeof options)}
                            className="form-checkbox"
                        />
                        <span className="capitalize text-sm font-medium">{opt}</span>
                    </label>
                ))}
            </div>
        </div>

        <PasswordStrengthMeter strength={strength} />

        <div className="flex justify-end">
            <button
              onClick={handleGeneratePassword}
              className="w-full sm:w-auto flex items-center justify-center gap-3 text-[var(--accent-contrast-text)] font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-[var(--accent-glow)] hover:shadow-xl hover:shadow-[0_0_20px_var(--accent-glow)] hover:scale-[1.03] bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)]"
            >
              <SparklesIcon className="w-5 h-5" />
              Generate New Password
            </button>
        </div>
    </div>
  );
};

export default PasswordGenerator;
