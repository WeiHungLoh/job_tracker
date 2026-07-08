import { ConfirmProvider } from 'material-ui-confirm';
import DemoNavbar from '../demoNavbar/DemoNavbar';
import DemoRoutes from './DemoRoutes';
import { UserPreferencesProvider } from '../../../../components/userPreferences/UserPreferencesProvider';
import { defaultConfirmOptions } from '../../../../components/confirmation/defaultConfirmOptions';
import styles from './DemoLayout.module.css';
import { useDemo } from '../../context/DemoContext';

const DemoLayoutContent = () => {
    const { state, updatePreferences } = useDemo();

    return (
        <UserPreferencesProvider preferences={state.preferences} updatePreferences={updatePreferences}>
            <DemoNavbar />
            <ConfirmProvider defaultOptions={defaultConfirmOptions}>
                <main className={styles.content}>
                    <DemoRoutes />
                </main>
            </ConfirmProvider>
        </UserPreferencesProvider>
    );
};

export default DemoLayoutContent;
