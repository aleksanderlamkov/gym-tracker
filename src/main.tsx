import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles.css';

// registerType: 'autoUpdate' сам активирует новый SW и перезагружает страницу,
// но iOS не проверяет обновление, если PWA долго висело в фоне — форсим проверку
// периодически и при каждом возврате в приложение.
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, r) {
    if (!r) return;
    const check = () => {
      r.update().catch(() => {});
    };
    setInterval(check, 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
  }
});

createRoot(document.getElementById('root')!).render(<App />);
