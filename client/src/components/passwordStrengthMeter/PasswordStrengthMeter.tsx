import { useEffect, useState } from 'react';
import { estimatePasswordStrength, type PasswordStrength } from './passwordStrength';
import styles from './PasswordStrengthMeter.module.css';

type PasswordStrengthMeterProps = {
    email: string;
    password: string;
};

const SCORE_CLASSES = [styles.veryWeak, styles.weak, styles.fair, styles.good, styles.strong] as const;
const STRENGTH_SEGMENTS = 4;
const ESTIMATION_DELAY_MS = 150;

const PasswordStrengthMeter = ({ email, password }: PasswordStrengthMeterProps) => {
    const [strength, setStrength] = useState<PasswordStrength | null>(null);

    useEffect(() => {
        setStrength(null);
        if (!password) {
            return;
        }

        let isActive = true;
        const timeout = window.setTimeout(() => {
            if (isActive) {
                setStrength(estimatePasswordStrength(password, email));
            }
        }, ESTIMATION_DELAY_MS);

        return () => {
            isActive = false;
            window.clearTimeout(timeout);
        };
    }, [email, password]);

    if (!password) {
        return null;
    }

    const activeSegments = strength ? Math.max(1, strength.score) : 0;
    const scoreClass = strength ? SCORE_CLASSES[strength.score] : '';

    return (
        <div className={styles.meter} id='password-strength' aria-live='polite'>
            <div className={styles.segments} aria-hidden='true'>
                {Array.from({ length: STRENGTH_SEGMENTS }, (_, index) => (
                    <span className={`${styles.segment} ${index < activeSegments ? scoreClass : ''}`} key={index} />
                ))}
            </div>
            <div className={styles.summary}>
                <span>{strength ? `Password strength: ${strength.label}` : 'Checking password strength…'}</span>
            </div>
        </div>
    );
};

export default PasswordStrengthMeter;
