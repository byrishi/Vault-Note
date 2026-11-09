import React, { useState, useCallback, useRef } from 'react';
import { decryptText } from '../services/cryptoService';
import LockOpenIcon from './icons/LockOpenIcon';
import CloudArrowUpIcon from './icons/CloudArrowUpIcon';

const DecryptView: React.FC = () => {
  const [encryptedContent, setEncryptedContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [decryptionKey, setDecryptionKey] = useState('');
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    setEncryptedContent(null);
    setError(null);
    setDecryptedText(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') setEncryptedContent(event.target.result);
      else setError('This file could not be read as a VaultNote file.');
    };
    reader.onerror = () => setError('We could not read this file. Please try another one.');
    reader.readAsText(file);
  };

  const handleDecrypt = useCallback(async () => {
    setError(null);
    setDecryptedText(null);
    if (!encryptedContent) {
      setError('Choose your encrypted .vault file first.');
      return;
    }
    if (!decryptionKey.trim()) {
      setError('Enter the key you saved when you sealed the note.');
      return;
    }
    setIsWorking(true);
    try {
      setDecryptedText(await decryptText(encryptedContent, decryptionKey));
      window.dispatchEvent(new Event('vaultnote:unlock'));
    } catch {
      setError('We could not open this note. Check that the key and file belong together.');
    } finally {
      setIsWorking(false);
    }
  }, [encryptedContent, decryptionKey]);

  const handleReset = () => {
    setEncryptedContent(null);
    setFileName('');
    setDecryptionKey('');
    setDecryptedText(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (decryptedText !== null) {
    return (
      <div className="decrypt-form">
        <div className="decrypted-header"><h4>Your note is open.</h4><span className="workspace-live"><span className="status-dot" />Only on this device</span></div>
        <pre className="decrypted-output">{decryptedText}</pre>
        <div className="form-actions"><button className="button button-secondary button-small" type="button" onClick={handleReset}>Open another note</button></div>
      </div>
    );
  }

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => { event.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => { event.preventDefault(); setIsDragging(false); };
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => { event.preventDefault(); setIsDragging(false); handleFile(event.dataTransfer.files?.[0] || null); };

  return (
    <div className="decrypt-form">
      <div>
        <span className="field-label">Encrypted note file</span>
        <label htmlFor="file-upload" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={'upload-dropzone' + (isDragging ? ' is-dragging' : '')}>
          <span className="upload-icon"><CloudArrowUpIcon className="w-5 h-5" /></span>
          <span className="upload-copy"><strong>{fileName ? 'Choose a different file' : 'Choose a .vault file or drop it here'}</strong><small>Files are opened locally in your browser.</small>{fileName && <span className="file-loaded">Selected: {fileName}</span>}</span>
          <input id="file-upload" ref={fileInputRef} name="file-upload" type="file" accept=".vault,.json,application/json,text/plain" onChange={(event) => handleFile(event.target.files?.[0] || null)} />
        </label>
      </div>
      <div><label className="field-label" htmlFor="decryption-key">Your private key</label><input type="password" id="decryption-key" value={decryptionKey} onChange={(event) => setDecryptionKey(event.target.value)} className="text-field" placeholder="Paste the key you saved" autoComplete="off" /></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><button className="button button-secondary button-small" type="button" onClick={handleReset}>Clear</button><button className="button button-primary button-small" type="button" onClick={handleDecrypt} disabled={!encryptedContent || !decryptionKey || isWorking}><LockOpenIcon className="w-4 h-4" />{isWorking ? 'Opening…' : 'Open this note'}</button></div>
    </div>
  );
};

export default DecryptView;
