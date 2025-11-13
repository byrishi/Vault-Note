
export enum AppMode {
  WriteEncrypt,
  DecryptView,
  PasswordGenerator,
}

export enum Theme {
  Dark = 'dark',
  Light = 'light',
  Hacker = 'hacker',
}

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string; // Tailwind bg color class
  textColor: string; // Tailwind text color class
  timeToCrack: string; // e.g., "5 hours", "2 million years"
}
