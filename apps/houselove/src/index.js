import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { init } from '@emailjs/browser';

// Initialize EmailJS
// fallback key preserved from original HTML to maintain behavior
const emailjsKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || "W1uc09q7N6dm3tDJH";
init(emailjsKey);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
