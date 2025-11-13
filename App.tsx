
import React, { useState, useEffect } from 'react';
import { AppMode, Theme } from './types';
import WriteEncrypt from './components/WriteEncrypt';
import DecryptView from './components/DecryptView';
import PasswordGenerator from './components/PasswordGenerator';
import ThemeSwitcher from './components/ThemeSwitcher';
import LockClosedIcon from './components/icons/LockClosedIcon';
import LockOpenIcon from './components/icons/LockOpenIcon';
import SparklesIcon from './components/icons/SparklesIcon';
import ShieldCheckIcon from './components/icons/ShieldCheckIcon';
import InformationCircleIcon from './components/icons/InformationCircleIcon';
import ExclamationTriangleIcon from './components/icons/ExclamationTriangleIcon';

const StatusIndicator: React.FC = () => (
    <a 
        href="https://status.rishishah.in" 
        target="_blank" 
        rel="noopener noreferrer"
        title="View Service Status"
        aria-label="View Service Status Page"
        className="group fixed top-0 left-0 z-10 p-4 sm:p-6 lg:p-8 flex items-center gap-2"
    >
        <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 group-hover:bg-green-300"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 group-hover:bg-green-400"></span>
        </div>
        <span className="text-sm font-medium text-[var(--text-muted-color)] transition-colors group-hover:text-[var(--text-color)] hidden sm:block">Status</span>
    </a>
);

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.WriteEncrypt);
  const [isHelpVisible, setIsHelpVisible] = useState<boolean>(false);
  const [isSecurityHelpVisible, setIsSecurityHelpVisible] = useState<boolean>(false);
  const [theme, setTheme] = useState<Theme>(() => {
    try {
        const savedTheme = localStorage.getItem('vaultnote-theme');
        return (savedTheme as Theme) || Theme.Dark;
    } catch {
        return Theme.Dark;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme); // for CSS specificity
    try {
        localStorage.setItem('vaultnote-theme', theme);
    } catch (e) {
        console.error("Failed to save theme to localStorage", e);
    }
  }, [theme]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const getTabClass = (tabMode: AppMode) => {
    return mode === tabMode
      ? 'bg-[var(--card-bg-hover)] text-[var(--text-strong)] shadow-lg'
      : 'text-[var(--text-muted-color)] hover:bg-[var(--card-bg)] hover:text-[var(--text-color)]';
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center font-[var(--body-font-family)]">
      <StatusIndicator />
      <div className="max-w-3xl mx-auto w-full">
         <div className="absolute top-0 right-0 z-10 p-4 sm:p-6 lg:p-8">
            <ThemeSwitcher theme={theme} setTheme={setTheme} />
        </div>
        <header className="text-center mb-10 pt-16 sm:pt-0">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text-strong)] tracking-tight">
            Vault
            <span 
              className="bg-gradient-to-r from-[var(--accent-color-light)] to-[var(--accent-color)] text-transparent bg-clip-text"
            >
              Note
            </span>
          </h1>
          <p className="mt-4 text-lg text-[var(--text-color)] animate-fade-in">
            Your thoughts, locked in time.
          </p>
        </header>

        <div className="bg-[var(--card-bg)] backdrop-blur-3xl rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-[var(--ring-color)] overflow-hidden">
          <div className="p-2">
            <nav className="flex space-x-2" aria-label="Tabs">
              <button
                onClick={() => setMode(AppMode.WriteEncrypt)}
                className={`flex-1 flex items-center justify-center gap-2 font-medium px-4 py-3 text-sm sm:text-base transition-all duration-300 ease-in-out rounded-lg ${getTabClass(AppMode.WriteEncrypt)}`}
              >
                <LockClosedIcon />
                Encrypt
              </button>
              <button
                onClick={() => setMode(AppMode.DecryptView)}
                className={`flex-1 flex items-center justify-center gap-2 font-medium px-4 py-3 text-sm sm:text-base transition-all duration-300 ease-in-out rounded-lg ${getTabClass(AppMode.DecryptView)}`}
              >
                <LockOpenIcon />
                Decrypt
              </button>
              <button
                onClick={() => setMode(AppMode.PasswordGenerator)}
                className={`flex-1 flex items-center justify-center gap-2 font-medium px-4 py-3 text-sm sm:text-base transition-all duration-300 ease-in-out rounded-lg ${getTabClass(AppMode.PasswordGenerator)}`}
              >
                <SparklesIcon />
                Generate
              </button>
            </nav>
          </div>

          <main className="p-6 sm:p-8">
            {mode === AppMode.WriteEncrypt && <WriteEncrypt />}
            {mode === AppMode.DecryptView && <DecryptView />}
            {mode === AppMode.PasswordGenerator && <PasswordGenerator />}
          </main>
        </div>
        
        <div className="text-center mt-8 flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-4">
          <button 
            onClick={() => setIsHelpVisible(!isHelpVisible)}
            className="text-sm font-medium text-[var(--accent-color)] hover:text-[var(--accent-color-hover)] transition-colors duration-300"
            aria-expanded={isHelpVisible}
          >
            {isHelpVisible ? 'Hide Instructions' : 'How does this work?'}
          </button>
          <button 
            onClick={() => setIsSecurityHelpVisible(!isSecurityHelpVisible)}
            className="text-sm font-medium text-[var(--accent-color)] hover:text-[var(--accent-color-hover)] transition-colors duration-300"
            aria-expanded={isSecurityHelpVisible}
          >
            {isSecurityHelpVisible ? 'Hide Security Details' : 'How secure is VaultNote?'}
          </button>
        </div>

        {isHelpVisible && (
          <div className="mt-6 bg-[var(--card-bg)] backdrop-blur-3xl rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-[var(--ring-color)] p-6 sm:p-8 animate-fade-in">
            <h3 className="text-xl font-bold text-[var(--text-strong)] mb-6 text-center">How to Use VaultNote</h3>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 text-left">
              <div>
                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2 text-[var(--text-color)]">
                  <LockClosedIcon className="w-5 h-5" />
                  To Encrypt a Note
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-[var(--text-muted-color)]">
                  <li>Write your secret message in the text area.</li>
                  <li>Click the <strong>Secure & Export</strong> button.</li>
                  <li>A <strong>.vault file</strong> containing your encrypted note will be downloaded.</li>
                  <li>
                    A unique <strong>Decryption Key</strong> will be shown on screen.
                    <strong className="block text-[var(--error-icon)]">You must save this key! It is the only way to open your note.</strong>
                  </li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2 text-[var(--text-color)]">
                  <LockOpenIcon className="w-5 h-5" />
                  To Decrypt a Note
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-[var(--text-muted-color)]">
                  <li>Go to the <strong>Decrypt</strong> tab.</li>
                  <li>Upload your encrypted file (e.g., your <strong>.vault file</strong>). You can decrypt files even if they've been renamed.</li>
                  <li>Paste the <strong>Decryption Key</strong> you saved.</li>
                  <li>Click <strong>Unlock</strong> to reveal your message.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {isSecurityHelpVisible && (
          <div className="mt-6 bg-[var(--card-bg)] backdrop-blur-3xl rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-[var(--ring-color)] p-6 sm:p-8 animate-fade-in">
            <h3 className="text-xl font-bold text-[var(--text-strong)] mb-6 text-center flex items-center justify-center gap-3">
                <ShieldCheckIcon className="w-6 h-6 text-green-400" />
                Security at its Core
            </h3>
            <div className="space-y-6 text-left text-[var(--text-muted-color)]">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1 text-[var(--accent-color)]">
                  <InformationCircleIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-[var(--text-color)]">Client-Side Only</h4>
                  <p>All operations—writing, encrypting, decrypting, and password generation—happen exclusively within your browser on your device. Your data is never sent to any server, ensuring complete privacy.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1 text-[var(--accent-color)]">
                  <LockClosedIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-[var(--text-color)]">Robust Encryption & Generation</h4>
                  <p>We use the industry-standard <strong className="font-semibold text-[var(--text-color)]">AES-256 encryption</strong> for notes and a <strong className="font-semibold text-[var(--text-color)]">cryptographically secure random number generator</strong> for passwords. This is the same level of security trusted by governments and financial institutions.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                 <div className="flex-shrink-0 pt-1 text-[var(--accent-color)]">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-[var(--text-color)]">Your Key, Your Responsibility</h4>
                  <p>The decryption key is generated randomly in your browser and is displayed to you once. <strong className="font-semibold text-[var(--error-icon)]">We do not store it, transmit it, or have any way to recover it.</strong> If you lose the key, your encrypted data is permanently and irreversibly lost. This is not a bug; it's a feature of true privacy.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="text-center mt-8 text-xs text-[var(--text-muted-color)] max-w-md mx-auto">
            <p>We’ll never see your thoughts — only you can.</p>
            <p>Everything is encrypted and processed on your device.</p>
            <div className="mt-4">
                <p className="mb-2 text-sm">
                  <a href="https://xyz.rishishah.in/vaultnote" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-color)] hover:text-[var(--accent-color-hover)] transition-colors duration-300">
                    📖 Read the full build story
                  </a>
                </p>
                <small style={{textAlign: 'center'}}>
                    Made with care by <a href="https://rishishah.in" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-color)] hover:text-[var(--accent-color-hover)] transition-colors duration-300">Rishi Shah</a>
                </small>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
