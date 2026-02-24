import React from 'react';
import ReactDOM from 'react-dom/client';
import { init } from '@emailjs/browser';
import App from './app/App';

init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY || "W1uc09q7N6dm3tDJH");

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
