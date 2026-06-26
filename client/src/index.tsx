import './index.css';
import App from './App';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './components/theme/ThemeContext';
import { ToastProvider } from './components/toast/ToastProvider';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
    <ThemeProvider>
        <ToastProvider>
            <App />
        </ToastProvider>
    </ThemeProvider>
);
