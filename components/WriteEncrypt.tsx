import React, { useState, useCallback, useEffect } from 'react';
import { encryptText, generateKey } from '../services/cryptoService';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import ClipboardIcon from './icons/ClipboardIcon';

const WriteEncrypt: React.FC = () => {
  const [content, setContent] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [encryptedData, setEncryptedData] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const words = content.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleEncrypt = useCallback(async () => {
    if (!content.trim()) return;
    setError(null);
    setIsWorking(true);
    window.dispatchEvent(new Event('vaultnote:stamp'));
    try {
      const key = generateKey();
      const data = await encryptText(content, key);
      setGeneratedKey(key);
      setEncryptedData(data);
    } catch {
      setError('We could not seal this note. Please try again.');
    } finally {
      setIsWorking(false);
    }
  }, [content]);

  const handleDownload = useCallback(() => {
    if (!encryptedData) return;
    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vaultnote-' + Date.now() + '.vault';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [encryptedData]);

  const handleCopyKey = useCallback(async () => {
    if (!generatedKey) return;
    try {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
    } catch {
      setError('Clipboard access was blocked. Select and copy the key above.');
    }
  }, [generatedKey]);

  const handleReset = () => {
    setContent('');
    setGeneratedKey(null);
    setEncryptedData(null);
    setCopied(false);
    setError(null);
  };

  if (generatedKey && encryptedData) {
    return (
      <div className="result-view">
        <div className="result-icon" aria-hidden="true">✓</div>
        <h4>Your note is sealed.</h4>
        <p>Keep this key somewhere safe. VaultNote can’t recover it for you.</p>
        <div className="key-card">
          <span className="key-label">Your private key</span>
          <div className="key-row"><code className="key-value">{generatedKey}</code><button className="copy-button" type="button" onClick={handleCopyKey} aria-label="Copy decryption key" title="Copy key"><ClipboardIcon className="w-5 h-5" /></button></div>
          {copied && <div className="copy-feedback" role="status" aria-live="polite">Copied to clipboard</div>}
        </div>
        <div className="notice-card"><span aria-hidden="true">✳</span><div><strong>Keep the key separate from the file</strong>Your note cannot be opened without this key. Save it before you leave this page.</div></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="result-actions"><button className="button button-primary button-small" type="button" onClick={handleDownload}><DocumentArrowDownIcon className="w-4 h-4" />Download .vault file</button><button className="button button-secondary button-small" type="button" onClick={handleReset}>Write another note</button></div>
      </div>
    );
  }

  return (
    <div className="note-editor-shell">
      <div>
        <label className="field-label" htmlFor="text-content">Your note</label>
        <textarea id="text-content" className="note-textarea" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Take a breath. Write what you want to keep private…" />
        <div className="field-meta" aria-live="polite">{words} {words === 1 ? 'word' : 'words'} · {content.length} characters</div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><button className={'button button-primary button-small seal-action' + (isWorking ? ' is-stamping' : '')} type="button" onClick={handleEncrypt} disabled={!content.trim() || isWorking}><img className="seal-button-mark" src="/logo.svg" alt="" aria-hidden="true" />{isWorking ? 'Sealing your note…' : 'Press the seal'}</button></div>
    </div>
  );
};

export default WriteEncrypt;
