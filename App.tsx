import React, { Suspense, useEffect, useRef, useState } from 'react';
import { AppMode } from './types';
import WriteEncrypt from './components/WriteEncrypt';
import DecryptView from './components/DecryptView';
import PasswordGenerator from './components/PasswordGenerator';
import LockClosedIcon from './components/icons/LockClosedIcon';
import LockOpenIcon from './components/icons/LockOpenIcon';
import SparklesIcon from './components/icons/SparklesIcon';

const SpatialScene = React.lazy(() => import('./components/SpatialScene'));

const BrandSeal: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img className={'brand-seal ' + className} src="/logo.svg" alt="" aria-hidden="true" draggable={false} />
);

const tools = [
  { mode: AppMode.WriteEncrypt, number: '01', title: 'Write', shortTitle: 'Write', detail: 'Leave a thought', icon: <LockClosedIcon /> },
  { mode: AppMode.DecryptView, number: '02', title: 'Open', shortTitle: 'Open', detail: 'Find what you kept', icon: <LockOpenIcon /> },
  { mode: AppMode.PasswordGenerator, number: '03', title: 'Make a key', shortTitle: 'Key', detail: 'Shape a new key', icon: <SparklesIcon /> },
];

const pageCopy: Record<AppMode, { title: string; kicker: string; subtitle: string }> = {
  [AppMode.WriteEncrypt]: {
    title: 'What should we keep?',
    kicker: 'A FRESH FIELD NOTE',
    subtitle: 'Some thoughts are meant to stay yours.',
  },
  [AppMode.DecryptView]: {
    title: 'Find what you kept.',
    kicker: 'UNSEAL A FIELD NOTE',
    subtitle: 'Bring the note and the key you saved.',
  },
  [AppMode.PasswordGenerator]: {
    title: 'Make a key of your own.',
    kicker: 'A KEY, MADE HERE',
    subtitle: 'Choose its shape. Keep it close.',
  },
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.WriteEncrypt);
  const [guideOpen, setGuideOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(true);
  const currentTool = tools.find((tool) => tool.mode === mode) || tools[0];
  const copy = pageCopy[mode];
  const guideRef = useRef<HTMLElement>(null);
  const guideCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let masterGain: GainNode | null = null;

    const getAudioContext = () => {
      if (audioContext) return audioContext;
      const AudioContextClass = window.AudioContext;
      if (!AudioContextClass) return null;
      try {
        audioContext = new AudioContextClass();
        masterGain = audioContext.createGain();
        masterGain.gain.value = .94;
        masterGain.connect(audioContext.destination);
        return audioContext;
      } catch {
        return null;
      }
    };

    const playMediaCue = (cue: 'page' | 'stamp' | 'unlock' | 'key') => {
      const player = new Audio('/sounds/' + cue + '.wav');
      player.volume = .86;
      void player.play().catch(() => undefined);
    };

    const onSoundPreference = (event: Event) => {
      if (!audioContext || !masterGain) return;
      const enabled = (event as CustomEvent<{ enabled: boolean }>).detail.enabled;
      const now = audioContext.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setTargetAtTime(enabled ? .94 : 0, now, .009);
    };

    const playCue = (cue: 'page' | 'stamp' | 'unlock' | 'key') => {
      if (!soundEnabledRef.current) return;
      const context = getAudioContext();
      if (!context) {
        playMediaCue(cue);
        return;
      }
      const playNow = () => {
        const outputGain = masterGain;
        if (!soundEnabledRef.current || context.state !== 'running' || !outputGain) return;
        const start = context.currentTime + .012;

        const tone = (frequency: number, duration: number, delay: number, volume: number, endFrequency?: number) => {
          const oscillator = context.createOscillator();
          const envelope = context.createGain();
          const at = start + delay;
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(frequency, at);
          if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, at + Math.min(.12, duration * .6));
          envelope.gain.setValueAtTime(.0001, at);
          envelope.gain.exponentialRampToValueAtTime(volume, at + .012);
          envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
          oscillator.connect(envelope);
          envelope.connect(outputGain);
          oscillator.start(at);
          oscillator.stop(at + duration + .015);
        };

        const softFoley = (duration: number, volume: number, lowpass: number) => {
          const frames = Math.max(1, Math.floor(context.sampleRate * duration));
          const buffer = context.createBuffer(1, frames, context.sampleRate);
          const channel = buffer.getChannelData(0);
          for (let index = 0; index < frames; index += 1) {
            const fade = 1 - index / frames;
            channel[index] = (Math.random() * 2 - 1) * fade * fade;
          }
          const source = context.createBufferSource();
          const filter = context.createBiquadFilter();
          const envelope = context.createGain();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(lowpass, start);
          filter.frequency.exponentialRampToValueAtTime(Math.max(180, lowpass * .38), start + duration);
          envelope.gain.setValueAtTime(volume, start);
          envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
          source.buffer = buffer;
          source.connect(filter);
          filter.connect(envelope);
          envelope.connect(outputGain);
          source.start(start);
          source.stop(start + duration + .01);
        };

        if (cue === 'page') {
          softFoley(.15, .085, 1650);
          tone(293.66, .15, .018, .035, 246.94);
        } else if (cue === 'stamp') {
          softFoley(.12, .15, 1150);
          tone(110, .24, 0, .2, 58.27);
          tone(220, .14, .02, .06, 164.81);
        } else if (cue === 'unlock') {
          tone(392, .28, 0, .075);
          tone(523.25, .31, .075, .065);
          tone(659.25, .38, .15, .052);
        } else {
          tone(440, .22, 0, .07);
          tone(587.33, .25, .055, .058);
          tone(783.99, .3, .12, .048);
        }
      };

      if (context.state === 'suspended') {
        void context.resume().then(() => {
          if (context.state === 'running') playNow();
          else playMediaCue(cue);
        }).catch(() => playMediaCue(cue));
      } else if (context.state === 'running') playNow();
      else playMediaCue(cue);
    };

    const primeAudio = () => {
      if (!soundEnabledRef.current) return;
      const context = getAudioContext();
      if (context?.state === 'suspended') void context.resume().catch(() => undefined);
    };
    const onPage = () => playCue('page');
    const onStamp = () => playCue('stamp');
    const onUnlock = () => playCue('unlock');
    const onKey = () => playCue('key');
    const onPreview = () => playCue('key');
    window.addEventListener('pointerdown', primeAudio, { once: true, passive: true });
    window.addEventListener('keydown', primeAudio, { once: true });
    window.addEventListener('vaultnote:page', onPage);
    window.addEventListener('vaultnote:stamp', onStamp);
    window.addEventListener('vaultnote:unlock', onUnlock);
    window.addEventListener('vaultnote:key', onKey);
    window.addEventListener('vaultnote:preview', onPreview);
    window.addEventListener('vaultnote:sound', onSoundPreference);
    return () => {
      window.removeEventListener('pointerdown', primeAudio);
      window.removeEventListener('keydown', primeAudio);
      window.removeEventListener('vaultnote:page', onPage);
      window.removeEventListener('vaultnote:stamp', onStamp);
      window.removeEventListener('vaultnote:unlock', onUnlock);
      window.removeEventListener('vaultnote:key', onKey);
      window.removeEventListener('vaultnote:preview', onPreview);
      window.removeEventListener('vaultnote:sound', onSoundPreference);
      if (audioContext && audioContext.state !== 'closed') void audioContext.close();
    };
  }, []);

  const toggleSound = () => {
    const next = !soundEnabledRef.current;
    soundEnabledRef.current = next;
    setSoundEnabled(next);
    window.dispatchEvent(new CustomEvent('vaultnote:sound', { detail: { enabled: next } }));
    if (next) window.dispatchEvent(new Event('vaultnote:preview'));
  };

  useEffect(() => {
    const animateSeal = () => {
      const stamp = document.querySelector<HTMLElement>('.floating-stamp');
      if (!stamp) return;
      stamp.classList.remove('is-stamping');
      void stamp.offsetWidth;
      stamp.classList.add('is-stamping');
    };
    window.addEventListener('vaultnote:stamp', animateSeal);
    return () => window.removeEventListener('vaultnote:stamp', animateSeal);
  }, []);

  useEffect(() => {
    if (!guideOpen) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    guideCloseRef.current?.focus();

    const keepFocusInGuide = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setGuideOpen(false);
      if (event.key !== 'Tab') return;
      const focusable = Array.from(guideRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])') || []);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === guideRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', keepFocusInGuide);
    return () => {
      window.removeEventListener('keydown', keepFocusInGuide);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      previouslyFocused?.focus();
    };
  }, [guideOpen]);

  return (
    <div className={'vault-experience mode-' + mode} id="workspace">
      <header className="brand-corner">
        <a className="brand-lockup" href="#workspace" aria-label="VaultNote workspace">
          <BrandSeal className="header-seal" />
          <span className="brand-wordmark">VaultNote</span>
        </a>
        <span className="brand-descriptor">THE CLOUD ARCHIVE</span>
      </header>

      <div className="privacy-orbit"><span className="orbit-dot" /><span>PRIVATE BY DESIGN</span><i>·</i><span>ONLY ON THIS DEVICE</span></div>
      <button className={'sound-toggle' + (soundEnabled ? ' is-on' : '')} type="button" onClick={toggleSound} aria-label={soundEnabled ? 'Turn sound off' : 'Turn sound on'} aria-pressed={soundEnabled} title={soundEnabled ? 'Sound on' : 'Sound off'}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10v4h4l5 3.3V6.7L8 10H4Z" /><path className="sound-wave" d="M16 9a4.2 4.2 0 0 1 0 6M18.5 6.7a7.4 7.4 0 0 1 0 10.6" /><path className="sound-muted" d="m16 9 5 6m0-6-5 6" /></svg>
      </button>
      <button className="guide-trigger" type="button" onClick={() => setGuideOpen(true)} aria-label="Open VaultNote field guide" title="Field guide">
        <span>?</span><small>FIELD GUIDE</small>
      </button>

      <main className="experience-stage">
        <nav className="artifact-rail" aria-label="Vault tools">
          <span className="rail-caption">CHOOSE AN OBJECT</span>
          <div className="rail-tools">
            {tools.map((tool) => (
              <button
                key={tool.mode}
                className={'artifact-tool' + (mode === tool.mode ? ' is-active' : '')}
                type="button"
                onClick={() => { if (mode !== tool.mode) window.dispatchEvent(new Event('vaultnote:page')); setMode(tool.mode); }}
                aria-label={tool.title + ': ' + tool.detail}
                aria-pressed={mode === tool.mode}
                title={tool.detail}
              >
                <span className="tool-medallion" aria-hidden="true">{tool.icon}<i /></span>
                <span className="tool-label"><strong>{tool.title}</strong><small>{tool.detail}</small></span>
                <span className="tool-index">{tool.number}</span>
              </button>
            ))}
          </div>
          <span className="rail-footnote">THREE LITTLE RITUALS</span>
        </nav>

        <section className="book-composition" aria-label={currentTool.title + ' workspace'}>
          <Suspense fallback={<div className="scene-loading" aria-hidden="true" />}>
            <SpatialScene mode={mode} />
          </Suspense>
          <div className="book-object" key={mode}>
            <aside className="journal-leaf left-leaf" aria-label="VaultNote archive note">
              <div className="left-leaf-top"><span>VAULTNOTE</span><span>EST. 2025</span></div>
              <div className="left-leaf-center">
                <span className="left-issue">THE QUIET ARCHIVE <i>01</i></span>
                <h2>Thoughts,<br />held close.</h2>
                <p>A small place for the things<br />that matter to you.</p>
                <div className="mini-orbit" aria-hidden="true"><i /><i /><i /><BrandSeal className="mini-orbit-seal" /></div>
              </div>
              <div className="left-leaf-bottom"><span>LOCAL FIRST</span><span>NO CLOUD · NO TRACE</span></div>
            </aside>

            <div className="book-seam" aria-hidden="true"><i /><i /><i /></div>

            <article className="journal-leaf interactive-leaf">
              <div className="leaf-registration">
                <span><i>{currentTool.number}</i><span className="registration-long">/ {currentTool.title.toUpperCase()}</span><span className="registration-short">/ {currentTool.shortTitle.toUpperCase()}</span></span>
                <span className="leaf-private"><b /> SEALED TO THIS DEVICE</span>
              </div>
              <div className="leaf-content">
                <div className="page-heading">
                  <p className="page-kicker"><span />{copy.kicker}</p>
                  <h1>{copy.title}</h1>
                  <p className="page-subtitle">{copy.subtitle}</p>
                </div>
                {mode === AppMode.WriteEncrypt && <WriteEncrypt />}
                {mode === AppMode.DecryptView && <DecryptView />}
                {mode === AppMode.PasswordGenerator && <PasswordGenerator />}
              </div>
              <div className="leaf-colophon"><span>VAULTNOTE · FIELD NOTE {currentTool.number}</span><span>THE CONTENTS NEVER LEAVE THIS PAGE</span></div>
              <BrandSeal className="floating-stamp" />
            </article>
          </div>
        </section>
      </main>

      <div className="experience-colophon"><span>01 / A PLACE TO KEEP WHAT MATTERS</span><span>ENCRYPTED HERE · KEPT BY YOU</span></div>

      {guideOpen && (
        <div className="guide-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setGuideOpen(false); }}>
          <section className="guide-spread" ref={guideRef} role="dialog" aria-modal="true" aria-labelledby="guide-title" tabIndex={-1}>
            <div className="guide-header">
              <div><span className="guide-kicker">VAULTNOTE FIELD GUIDE · ISSUE 01</span><h2 id="guide-title">Keep your thoughts close.</h2></div>
              <button ref={guideCloseRef} className="guide-close" type="button" onClick={() => setGuideOpen(false)} aria-label="Close field guide">×</button>
            </div>
            <div className="guide-pages">
              <article className="guide-page">
                <p className="guide-section-label"><span>01</span> HOW TO USE VAULTNOTE</p>
                <h3>Seal a note</h3>
                <ol><li>Write your message on the page.</li><li>Press the seal. VaultNote encrypts it in your browser.</li><li>Download the <code>.vault</code> file.</li><li>Save the decryption key shown on screen. You’ll need both the file and key to open the note.</li></ol>
                <h3>Open a note</h3>
                <ol><li>Choose <strong>Open</strong> on the tool rail.</li><li>Select your encrypted file.</li><li>Enter the key you saved, then choose <strong>Open this note</strong>.</li></ol>
                <p className="guide-warning">The key is shown once and can’t be recovered if lost.</p>
              </article>
              <article className="guide-page">
                <p className="guide-section-label"><span>02</span> PRIVACY, BY DESIGN</p>
                <h3>Your browser does the work.</h3>
                <p>VaultNote encrypts and decrypts notes on your device with AES-256 in GCM mode. Each note gets a unique 256-bit key and a fresh random initialization vector, generated with your browser’s cryptographically secure random number generator. Passwords are generated locally with the same secure source.</p>
                <p>Your notes and keys are not sent to a server. VaultNote does not store or transmit your decryption key. If you lose it, your encrypted note cannot be recovered.</p>
                <div className="guide-about">
                  <h3>About VaultNote</h3>
                  <p className="guide-tagline">Your thoughts, locked in time.</p>
                  <p>A local-first, zero-knowledge encrypted notes app. “We’ll never see your thoughts — only you can.” Open-source and made with care by <a href="https://rishishah.in/" target="_blank" rel="noopener noreferrer">Rishi Shah</a>.</p>
                  <p>Interaction sounds are made on this device. The speaker control previews a short chime when sound is turned back on and mutes every cue.</p>
                  <div className="guide-links"><a href="https://github.com/byrishi/Vault-Note" target="_blank" rel="noopener noreferrer">Source code ↗</a><a href="https://github.com/byrishi/Vault-Note/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer">Security policy ↗</a><a href="https://xyz.rishishah.in/vaultnote" target="_blank" rel="noopener noreferrer">Full build story ↗</a><a href="https://status.rishishah.in" target="_blank" rel="noopener noreferrer">Service status ↗</a></div>
                </div>
              </article>
            </div>
            <div className="guide-footer"><span>© 2026 VaultNote · Made with care by <a href="https://rishishah.in/" target="_blank" rel="noopener noreferrer">Rishi Shah</a></span><span>OPEN-SOURCE · ZERO-KNOWLEDGE · PRIVATE BY DESIGN</span></div>
          </section>
        </div>
      )}
    </div>
  );
};

export default App;
