# VaultNote
**VaultNote** — a local-first, browser-based encrypted notes app.

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/byrishi/Vault-Note)
![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)
![Zero Knowledge](https://img.shields.io/badge/Zero--Knowledge-True-success)
![AES-256](https://img.shields.io/badge/Encryption-AES--256-orange)

![VaultNote screenshot](https://res.cloudinary.com/dvfcmsymt/image/upload/v1763048209/Screenshot_2025-11-13_205003_iscci5.png)

VaultNote is built with modern web tech (Vite + React + TypeScript). It performs all cryptographic operations **locally in the browser** using the Web Crypto API (AES-GCM). No data is sent to any server by default.

## Features

- Local-first AES-GCM encryption in-browser
- Zero-knowledge passphrase-based access
- Password generator and secure export/import
- Simple, minimal UI designed for focus and security
- Extensible architecture (adapters for optional features)

## Quick start

```bash
git clone https://github.com/YOUR_ORG/vaultnote.git
cd vaultnote
npm ci
npm run dev
```

### Configuration
Create a `.env` locally if you need to enable optional integrations. **Do not commit secrets**.

### Privacy & Security
All crypto happens on the client. VaultNote never sends your plaintext notes to any server.

## Contributing
Contributions are welcome! See `CONTRIBUTING.md`.

## License
This project is licensed under the Apache-2.0 License. See `LICENSE` file for details.

## Branding
This open-source release preserves VaultNote branding and assets. See `BRANDING.md` for trademark and logo usage guidelines.
