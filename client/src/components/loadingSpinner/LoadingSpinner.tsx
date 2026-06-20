import styles from './LoadingSpinner.module.css'

const LoadingSpinner: React.FC<React.HTMLAttributes<HTMLDivElement>> = () => {
    return <div className={styles.loadingSpinner} />
}

export default LoadingSpinner
