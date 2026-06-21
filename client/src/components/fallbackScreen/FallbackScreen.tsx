import type { FallbackScreenProps } from './models';
import LoadingSpinner from '../loadingSpinner/LoadingSpinner';
import PrimaryButton from '../button/PrimaryButton';
import styles from './FallbackScreen.module.css';

const FallbackScreen = ({ variant = 'loading', onAction }: FallbackScreenProps) => {
    const isLoading = variant === 'loading';

    return (
        <main className={styles.fallback} aria-live='polite' aria-busy={isLoading}>
            <div className={styles.content}>
                {isLoading ? (
                    <>
                        <LoadingSpinner />
                        <h2>Checking authentication status</h2>
                    </>
                ) : variant === 'notFound' ? (
                    <>
                        <h2>Page not found</h2>
                        <p>The page you requested does not exist.</p>
                        <PrimaryButton onClick={onAction} type='button'>
                            Go to job applications
                        </PrimaryButton>
                    </>
                ) : (
                    <>
                        <h2>Unable to verify authentication. Please try again.</h2>
                        <PrimaryButton onClick={onAction} type='button'>
                            Try again
                        </PrimaryButton>
                    </>
                )}
            </div>
        </main>
    );
};

export default FallbackScreen;
