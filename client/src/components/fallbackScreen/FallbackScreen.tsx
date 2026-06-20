import type { FallbackScreenProps } from './models'
import LoadingSpinner from '../loadingSpinner/LoadingSpinner'
import PrimaryButton from '../button/PrimaryButton'
import styles from './FallbackScreen.module.css'

const FallbackScreen = ({ error = false, onRetry }: FallbackScreenProps) => (
    <main className={styles.fallback} aria-live='polite' aria-busy={!error}>
        <div className={styles.content}>
            {error ? (
                <>
                    <h2>Unable to verify authentication. Please try again.</h2>
                    <PrimaryButton onClick={onRetry} type='button'>Try again</PrimaryButton>
                </>
            ) : (
                <>
                    <LoadingSpinner />
                    <h2>Checking authentication status</h2>
                </>
            )}
        </div>
    </main>
)

export default FallbackScreen
