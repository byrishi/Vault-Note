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

const secureRandom = (max: number): number => {
  const range = 0x100000000;
  const limit = Math.floor(range / max) * max;
  const values = new Uint32Array(1);
  do {
    window.crypto.getRandomValues(values);
  } while (values[0] >= limit);
  return values[0] % max;
};

const formatTimeToCrack = (combinations: number): string => {
  const seconds = combinations / 1e13;
  if (!Number.isFinite(seconds) || seconds > 3.15e28) return 'an eternity';
  if (seconds < 0.01) return 'instantly';
  if (seconds < 60) return Math.max(1, Math.round(seconds)) + ' seconds';
  const minutes = seconds / 60;
  if (minutes < 60) return Math.round(minutes) + ' minutes';
  const hours = minutes / 60;
  if (hours < 24) return Math.round(hours) + ' hours';
  const days = hours / 24;
  if (days < 365.25) return Math.round(days) + ' days';
  const years = days / 365.25;
  const suffixes = [
    { value: 1e24, name: 'septillion' }, { value: 1e21, name: 'sextillion' }, { value: 1e18, name: 'quintillion' },
    { value: 1e15, name: 'quadrillion' }, { value: 1e12, name: 'trillion' }, { value: 1e9, name: 'billion' },
    { value: 1e6, name: 'million' }, { value: 1e3, name: 'thousand' },
  ];
  for (const suffix of suffixes) if (years >= suffix.value) return Math.floor(years / suffix.value).toLocaleString() + ' ' + suffix.name + ' years';
  return Math.floor(years).toLocaleString() + ' years';
};

const PasswordGenerator: React.FC = () => {
  const [password, setPassword] = useState('CLICK-GENERATE');
  const [displayedPassword, setDisplayedPassword] = useState('CLICK-GENERATE');
  const [isGenerating, setIsGenerating] = useState(false);
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({ uppercase: true, lowercase: true, numbers: true, symbols: true });
  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState<PasswordStrength | null>(null);

  useEffect(() => {
    if (password === 'CLICK-GENERATE' || !isGenerating) {
      setDisplayedPassword(password);
      return;
    }
    let index = 0;
    setDisplayedPassword('');
    const intervalId = window.setInterval(() => {
      setDisplayedPassword((previous) => previous + password.charAt(index));
      index += 1;
      if (index >= password.length) {
        window.clearInterval(intervalId);
        setIsGenerating(false);
      }
    }, 28);
    return () => window.clearInterval(intervalId);
  }, [password, isGenerating]);

  useEffect(() => { setStrength(null); }, [length]);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const calculateStrength = useCallback((pass: string, selected: typeof options): PasswordStrength | null => {
    if (!pass || pass === 'CLICK-GENERATE' || pass === 'SELECT-OPTIONS') return null;
    let charPool = 0;
    if (selected.uppercase) charPool += CHARSETS.uppercase.length;
    if (selected.lowercase) charPool += CHARSETS.lowercase.length;
    if (selected.numbers) charPool += CHARSETS.numbers.length;
    if (selected.symbols) charPool += CHARSETS.symbols.length;
    if (charPool === 0) return null;
    const entropy = pass.length * Math.log2(charPool);
    const timeToCrack = formatTimeToCrack(Math.pow(2, entropy));
    if (entropy < 35) return { score: 1, label: 'Very weak', color: 'bg-red-500', textColor: 'text-red-500', timeToCrack };
    if (entropy < 60) return { score: 2, label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-500', timeToCrack };
    if (entropy < 100) return { score: 3, label: 'Strong', color: 'bg-green-400', textColor: 'text-green-400', timeToCrack };
    return { score: 4, label: 'Very strong', color: 'bg-green-600', textColor: 'text-green-600', timeToCrack };
  }, []);

  const handleGeneratePassword = useCallback(() => {
    const selectedCharsets = Object.entries(options).filter(([, enabled]) => enabled).map(([type]) => CHARSETS[type as keyof typeof CHARSETS]);
    if (selectedCharsets.length === 0) {
      setPassword('SELECT-OPTIONS');
      setIsGenerating(false);
      setStrength({ score: 0, label: 'Choose at least one', color: '', textColor: 'text-[var(--warning-text)]', timeToCrack: 'N/A' });
      return;
    }
    const allChars = selectedCharsets.join('');
    let generated = selectedCharsets.map((charset) => charset.charAt(secureRandom(charset.length))).join('');
    for (let index = generated.length; index < length; index += 1) generated += allChars.charAt(secureRandom(allChars.length));
    const characters = generated.split('');
    for (let index = characters.length - 1; index > 0; index -= 1) {
      const swapIndex = secureRandom(index + 1);
      [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
    }
    generated = characters.join('');
    setPassword(generated);
    setIsGenerating(true);
    setStrength(calculateStrength(generated, options));
    window.dispatchEvent(new Event('vaultnote:key'));
  }, [length, options, calculateStrength]);

  const handleCopy = useCallback(async () => {
    if (!password || password === 'CLICK-GENERATE' || password === 'SELECT-OPTIONS') return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [password]);

  const handleOptionChange = (option: keyof typeof options) => {
    setOptions((previous) => ({ ...previous, [option]: !previous[option] }));
    setStrength(null);
  };

  const passwordText = displayedPassword === 'CLICK-GENERATE' ? 'Your password will appear here' : displayedPassword === 'SELECT-OPTIONS' ? 'Choose at least one character type' : displayedPassword;

  return (
    <div className="password-tool">
      <div>
        <span className="field-label">A password made on this device</span>
        <div className="password-result"><code className={password === 'CLICK-GENERATE' || password === 'SELECT-OPTIONS' ? 'password-placeholder' : ''}>{passwordText}{isGenerating && <span aria-hidden="true">▏</span>}</code><button className="copy-button" type="button" onClick={handleCopy} aria-label="Copy generated password" title="Copy password"><ClipboardIcon className="w-5 h-5" /></button></div>
        {copied && <div className="copy-feedback" role="status" aria-live="polite">Copied to clipboard</div>}
      </div>
      <div>
        <div className="range-row"><label className="field-label" htmlFor="length">Password length</label><span className="range-value">{length}</span></div>
        <input id="length" className="range-control" type="range" min="8" max="64" value={length} onChange={(event) => setLength(Number(event.target.value))} />
      </div>
      <fieldset className="character-options" style={{ border: 0, padding: 0, margin: 0 }}><legend className="field-label">Include character types</legend><div className="option-grid">{Object.keys(CHARSETS).map((option) => <label key={option} className="option-card"><input type="checkbox" checked={options[option as keyof typeof options]} onChange={() => handleOptionChange(option as keyof typeof options)} /><span>{option.charAt(0).toUpperCase() + option.slice(1)}</span></label>)}</div></fieldset>
      <PasswordStrengthMeter strength={strength} />
      <div className="form-actions"><button className="button button-primary button-small" type="button" onClick={handleGeneratePassword}><SparklesIcon className="w-4 h-4" />Generate a password</button></div>
    </div>
  );
};

export default PasswordGenerator;
