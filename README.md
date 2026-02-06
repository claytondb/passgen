# PassGen

Secure password generator with customizable options.

## Features

- **Length Control** - Generate passwords of any length
- **Character Sets** - Include/exclude:
  - Uppercase letters (A-Z)
  - Lowercase letters (a-z)
  - Numbers (0-9)
  - Symbols (!@#$%^&*)
- **Copy to Clipboard** - One-click copy
- **Password Strength** - Visual strength indicator

## Usage

1. Open `index.html` in a browser
2. Set desired password length
3. Toggle character types
4. Click Generate
5. Copy to clipboard

## Security

- All generation happens locally in your browser
- No passwords are sent to any server
- Uses `crypto.getRandomValues()` for secure randomness

## Tech

- Pure HTML/CSS/JavaScript
- No external dependencies
- Works offline

## License

MIT
