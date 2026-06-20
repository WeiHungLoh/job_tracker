import type { ShowNotesButtonProps } from './models'
import styles from './ShowNotesButton.module.css'

const ShowNotesButton = ({ toggled, onToggle }: ShowNotesButtonProps) => {
    const buttonMessage = (toggled: boolean) => {
        return toggled ? 'Hide Notes' : 'Unhide Notes'
    }

    return (
        <div className={styles.hideNotesButton}>
            <div>{buttonMessage(toggled)}</div>
            <button className={`${styles.toggleButton} ${toggled ? styles.active : ''}`}
                onClick={onToggle}>
                <div className={styles.thumb} />
            </button>
        </div>
    )
}

export default ShowNotesButton
