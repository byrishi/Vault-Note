import React, { useState, useCallback, useRef } from 'react';
import { decryptText } from '../services/cryptoService';
import LockOpenIcon from './icons/LockOpenIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import CloudArrowUpIcon from './icons/CloudArrowUpIcon';

const DecryptView: React.FC = () => {
  const [encryptedContent, setEncryptedContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [decryptionKey, setDecryptionKey] = useState<string>('');
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setEncryptedContent(event.target?.result as string);
        setError(null);
        setDecryptedText(null);
      };
      reader.onerror = () => {
          setError("Failed to read the file.");
      }
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] || null);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0] || null);
  };

  const triggerErrorAnimation = () => {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 820);
  }

  const handleDecrypt = useCallback(async () => {
    setError(null);
    setDecryptedText(null);

    if (!encryptedContent) {
      setError('Please upload an encrypted file first.');
      triggerErrorAnimation();
      return;
    }
    if (!decryptionKey.trim()) {
      setError('Please enter the decryption key.');
      triggerErrorAnimation();
      return;
    }

    try {
      const text = await decryptText(encryptedContent, decryptionKey);
      setDecryptedText(text);
    } catch (e: any) {
      setError(e.message || "Decryption failed.");
      triggerErrorAnimation();
    }
  }, [encryptedContent, decryptionKey]);

  const handleReset = () => {
      setEncryptedContent(null);
      setFileName('');
      setDecryptionKey('');
      setDecryptedText(null);
      setError(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  if (decryptedText) {
      return (
          <div className="flex flex-col gap-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-[var(--text-strong)]">Thought Unlocked</h2>
               <div className="w-full bg-[var(--card-bg)] backdrop-blur-lg border border-[var(--ring-color)] rounded-lg p-4 text-[var(--text-color)] max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-base">{decryptedText}</pre>
              </div>
              <div className="flex justify-start">
                  <button onClick={handleReset} 
                    className="bg-[var(--card-bg)] hover:bg-[var(--card-bg-hover)] text-[var(--text-strong)] font-bold py-2 px-5 rounded-lg transition-all duration-300 ease-in-out ring-1 ring-[var(--ring-color)]"
                    >
                      Decrypt Another
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <label 
            htmlFor="file-upload" 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group relative cursor-pointer w-full flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed rounded-lg transition-all duration-300 ease-in-out backdrop-blur-lg
            ${isDragging ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/20' : 'border-[var(--border-color-dashed)] bg-[var(--card-bg)] hover:border-[var(--accent-color)]/50 hover:bg-[var(--card-bg-hover)]'}`}
        >
            <div className="space-y-2 text-center">
                <CloudArrowUpIcon className={`mx-auto h-12 w-12 text-[var(--text-muted-color)] transition-colors duration-300 group-hover:text-[var(--accent-color)] ${isDragging ? 'text-[var(--accent-color)]' : ''}`} />
                <div className="flex text-sm text-[var(--text-muted-color)] justify-center">
                    <span className={`font-medium text-[var(--accent-color)] transition-colors duration-300`}>
                        {fileName ? 'Replace file' : 'Upload a file'}
                    </span>
                    <p className="pl-1">or drag and drop</p>
                </div>
                {fileName ? <p className="text-sm text-[var(--success-text)] font-medium mt-2">{fileName}</p> : <p className="text-xs text-[var(--text-muted-color)]">Upload any encrypted file</p>}
            </div>
            <input id="file-upload" ref={fileInputRef} name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
        </label>
      </div>
      
      <div>
        <input
          type="text"
          id="decryption-key"
          value={decryptionKey}
          onChange={(e) => setDecryptionKey(e.target.value)}
          className="w-full bg-[var(--card-bg)] backdrop-blur-lg border border-[var(--ring-color)] rounded-lg p-3 text-[var(--text-color)] placeholder:text-[var(--text-muted-color)] focus:ring-2 focus:ring-[var(--accent-color)]/80 focus:border-[var(--accent-color)] focus:bg-[var(--card-bg-hover)] transition-all duration-300 ease-in-out font-mono text-center"
          placeholder="Enter decryption key"
        />
      </div>

      {error && (
        <div className={`p-3 rounded-lg bg-[var(--error-bg)] backdrop-blur-lg border border-[var(--error-border)] text-[var(--error-text)] flex items-center gap-3 text-sm font-medium ${isShaking ? 'animate-shake' : ''}`}>
          <ExclamationTriangleIcon className="flex-shrink-0 w-5 h-5 text-[var(--error-icon)]" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button
            onClick={handleReset}
            className="bg-[var(--card-bg)] text-[var(--text-color)] font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out hover:bg-[var(--card-bg-hover)] ring-1 ring-[var(--ring-color)]"
        >
            Reset
        </button>
        <button
          onClick={handleDecrypt}
          disabled={!encryptedContent || !decryptionKey}
          className="flex items-center gap-2 text-[var(--accent-contrast-text)] font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg disabled:shadow-none disabled:scale-100 disabled:bg-[var(--disabled-bg)] disabled:text-[var(--disabled-text)] disabled:cursor-not-allowed enabled:shadow-[var(--accent-glow)] enabled:hover:shadow-xl enabled:hover:shadow-[0_0_20px_var(--accent-glow)] enabled:hover:scale-[1.03] enabled:bg-[var(--accent-color)] enabled:hover:bg-[var(--accent-color-hover)]"
        >
          <LockOpenIcon className="w-5 h-5" />
          Unlock
        </button>
      </div>
    </div>
  );
};

export default DecryptView;