export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1a2744', light: '#243358', dark: '#0f1a30' },
        // Accent: warm terracotta per design handoff
        accent: { DEFAULT: '#b8443a', hover: '#c0392b' },
        // Warm sidebar palette
        warm: {
          surface:     '#fbf8f1',
          border:      '#ece6d9',
          hover:       '#f1ebdd',
          'soft':      '#f5e6e3',
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
