export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1a2744', light: '#243358', dark: '#0f1a30' },
        // Accent: SITA green
        accent: { DEFAULT: '#2b3e2b', hover: '#233423' },
        // Warm sidebar palette
        warm: {
          surface:     '#F3F3F0',
          border:      '#ece6d9',
          hover:       '#f1ebdd',
          'soft':      '#e8ede8',
          ink:         '#2a2f3d',
          ink2:        '#5d6478',
          ink3:        '#8b91a4',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    }
  },
  plugins: []
}
