import './index.css';
import App from './App';
import ReactDOM from 'react-dom/client';
import { ToastProvider } from './components/toast/ToastProvider';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
    <ToastProvider>
        <App />
    </ToastProvider>
);
