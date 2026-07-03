import { CSVLink } from 'react-csv';
import Icon from '../icon/Icon';
import PrimaryButton from '../button/PrimaryButton';
import ControlDropdown from './ControlDropdown';
import type { MoreOptionsProps } from './models';
import styles from './MoreOptions.module.css';

const MoreOptions = ({ csvData, csvFilename, csvHeaders, deleteLabel, id, isDeleting, onDelete }: MoreOptionsProps) => (
    <ControlDropdown id={id} label='More...'>
        <div className={styles.options}>
            <CSVLink className={styles.action} data={csvData} filename={csvFilename} headers={csvHeaders}>
                <Icon name='export' size={18} />
                <span>Export as CSV</span>
            </CSVLink>
            <hr className={styles.divider} />
            <PrimaryButton
                className={`${styles.action} ${styles.deleteAction}`}
                isLoading={isDeleting}
                onClick={onDelete}
                type='button'
                variant='secondary'
            >
                <Icon name='delete' size={18} />
                <span>{deleteLabel}</span>
            </PrimaryButton>
        </div>
    </ControlDropdown>
);

export default MoreOptions;
