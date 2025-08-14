/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chat-bg': '#f7f7f8',
        'chat-dark-bg': '#212121',
        'message-user': '#f0f0f0',
        'message-assistant': '#ffffff',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}