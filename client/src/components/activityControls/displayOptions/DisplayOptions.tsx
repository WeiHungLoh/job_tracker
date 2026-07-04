import type { DisplayOptionsProps } from '../models';
import ControlDropdown from '../ControlDropdown';
import styles from './DisplayOptions.module.css';

const DisplayOptions = ({ children, id }: DisplayOptionsProps) => (
    <ControlDropdown id={id} label='Display options'>
        <div className={styles.options}>{children}</div>
    </ControlDropdown>
);

export default DisplayOptions;
