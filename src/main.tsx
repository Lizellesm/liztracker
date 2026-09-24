import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { requestPersistentStorage } from './db';
import { applyTheme, getTheme } from './theme';
import '@fontsource-variable/nunito';
import './styles.css';

requestPersistentStorage();
applyTheme(getTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
