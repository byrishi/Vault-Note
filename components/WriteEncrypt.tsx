import React, { useState, useCallback, useEffect } from 'react';
import { encryptText, generateKey } from '../services/cryptoService';
import LockClosedIcon from './icons/LockClosedIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';

const WriteEncrypt: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [stats, setStats] = useState({ words: 0, chars: 0 });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [encryptedData, setEncryptedData] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  useEffect(() => {
    if (generatedKey && encryptedData) {
      const timer = setTimeout(() => setIsKeyVisible(true), 100); // for fade-in
      return () => clearTimeout(timer);
    }
  }, [generatedKey, encryptedData]);

  useEffect(() => {
    const chars = content.length;
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    setStats({ words, chars });
  }, [content]);

  const handleEncrypt = useCallback(async () => {
    if (!content.trim()) return;
    const key = generateKey();
    try {
      const data = await encryptText(content, key);
      setGeneratedKey(key);
      setEncryptedData(data);
    } catch (e) {
      console.error("Encryption failed:", e);
      // Optionally: set an error state to show the user.
    }
  }, [content]);

  const handleDownload = useCallback(() => {
    if (!encryptedData) return;
    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vaultnote-${Date.now()}.vault`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [encryptedData]);
  
  const handleCopyKey = useCallback(() => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  }, [generatedKey]);

  const handleReset = () => {
      setContent('');
      setGeneratedKey(null);
      setEncryptedData(null);
      setCopied(false);
      setIsKeyVisible(false);
  }

  if (generatedKey && encryptedData) {
    return (
      <div className={`flex flex-col items-center text-center transition-opacity duration-500 ease-in-out ${isKeyVisible ? 'opacity-100' : 'opacity-0'}`}>
        <h2 className="text-2xl font-bold text-[var(--text-strong)]">Encrypted. Archived. Yours.</h2>
        <p className="mt-2 text-[var(--text-muted-color)]">Save your decryption key. It is not recoverable.</p>
        
        <div className="mt-6 w-full max-w-md bg-[var(--card-bg)] backdrop-blur-lg rounded-lg p-4 relative font-mono shadow-lg ring-1 ring-[var(--ring-color)] animate-pulse-glow-green">
            <p className="text-xs text-[var(--text-muted-color)] uppercase font-semibold tracking-wider">Decryption Key</p>
            <div className="flex items-center gap-4 mt-2">
                <code className="text-[var(--success-text)] text-lg break-all flex-1 text-left select-all">{generatedKey}</code>
                <button
                    onClick={handleCopyKey}
                    className="p-2 rounded-md bg-[var(--card-bg-hover)] hover:bg-white/20 text-[var(--text-muted-color)] hover:text-[var(--text-strong)] transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[var(--accent-color)]"
                    title="Copy Key"
                >
                    <ClipboardIcon className="w-5 h-5"/>
                </button>
            </div>
            {copied && <div className="absolute -top-3 right-3 text-[var(--success-text)] text-xs px-2 py-0.5 rounded font-sans bg-[var(--success-bg)] animate-fade-in">Copied!</div>}
        </div>
        
        <div className="mt-6 p-4 rounded-lg bg-[var(--warning-bg)] backdrop-blur-lg border border-[var(--warning-border)] text-[var(--warning-text)] flex items-start gap-3 max-w-md">
            <div className="flex-shrink-0 pt-0.5 text-[var(--warning-icon)]">
                <ExclamationTriangleIcon className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-semibold text-[var(--warning-heading)]">A Note on Privacy</h3>
                <p className="text-sm">If you lose this key, your text cannot be recovered. We don’t keep secrets for you.</p>
            </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
                onClick={handleDownload}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-[var(--accent-contrast-text)] font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out text-base shadow-lg shadow-[var(--accent-glow)] hover:shadow-xl hover:shadow-[0_0_20px_var(--accent-glow)] hover:scale-[1.03] bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)]"
            >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Download .vault File
            </button>
             <button
                onClick={handleReset}
                className="w-full sm:w-auto bg-[var(--card-bg)] hover:bg-[var(--card-bg-hover)] text-[var(--text-strong)] font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out text-base ring-1 ring-[var(--ring-color)]"
            >
                Create New Note
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div>
        <textarea
          id="text-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-80 bg-[var(--card-bg)] backdrop-blur-lg border border-[var(--ring-color)] rounded-lg p-4 text-[var(--text-color)] placeholder:text-[var(--text-muted-color)] focus:ring-2 focus:ring-[var(--accent-color)]/80 focus:border-[var(--accent-color)] focus:bg-[var(--card-bg-hover)] transition-all duration-300 ease-in-out text-base resize-y"
          placeholder="Begin your entry. Your thoughts are ephemeral until locked."
        />
        <div className="text-right text-xs text-[var(--text-muted-color)] font-mono tracking-wider pr-2 mt-2">
          {stats.chars} characters &bull; {stats.words} words
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleEncrypt}
          disabled={!content.trim()}
          className="flex items-center gap-2 text-[var(--accent-contrast-text)] font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg disabled:shadow-none disabled:scale-100 disabled:bg-[var(--disabled-bg)] disabled:text-[var(--disabled-text)] disabled:cursor-not-allowed enabled:shadow-[var(--accent-glow)] enabled:hover:shadow-xl enabled:hover:shadow-[0_0_20px_var(--accent-glow)] enabled:hover:scale-[1.03] enabled:bg-[var(--accent-color)] enabled:hover:bg-[var(--accent-color-hover)]"
        >
          <LockClosedIcon className="w-5 h-5" />
          Secure & Export
        </button>
      </div>
    </div>
  );
};

export default WriteEncrypt;