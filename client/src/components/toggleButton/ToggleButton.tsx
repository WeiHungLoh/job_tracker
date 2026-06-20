import type { ToggleButtonProps } from './models'
import styles from './ToggleButton.module.css'

const ToggleButton = ({ toggled, onToggle }: ToggleButtonProps) => {
    const buttonMessage = (toggled: boolean) => {
        return toggled ? 'Hide Archive' : 'Unhide Archive'
    }

    return (
        <div className={styles.hideArchiveButton}>
            <div>{buttonMessage(toggled)}</div>
            <button className={`${styles.toggleButton} ${toggled ? styles.active : ''}`}
                onClick={onToggle}>
                <div className={styles.thumb} />
            </button>
        </div>
    )
}

export default ToggleButton
