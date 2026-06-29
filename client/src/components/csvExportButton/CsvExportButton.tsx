import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';
import { CSVLink } from 'react-csv';
import PrimaryButton from '../button/PrimaryButton';

type CsvExportButtonProps = Pick<ComponentProps<typeof CSVLink>, 'data' | 'filename' | 'headers'>;

const EXPORT_FEEDBACK_MS = 1000;

const CsvExportButton = ({ data, filename, headers }: CsvExportButtonProps) => {
    const [isExporting, setIsExporting] = useState(false);
    const resetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (resetTimeout.current) {
                clearTimeout(resetTimeout.current);
            }
        };
    }, []);

    const handleExport = () => {
        setIsExporting(true);
        resetTimeout.current = setTimeout(() => setIsExporting(false), EXPORT_FEEDBACK_MS);
    };

    return (
        <PrimaryButton isLoading={isExporting} variant='secondary'>
            <CSVLink
                data={data}
                filename={filename}
                headers={headers}
                onClick={handleExport}
                style={{ color: 'inherit', textDecoration: 'none' }}
            >
                Export as CSV
            </CSVLink>
        </PrimaryButton>
    );
};

export default CsvExportButton;
