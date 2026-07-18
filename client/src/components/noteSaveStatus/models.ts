import type { NoteSaveStatus } from '../../hooks/useAutosaveNotes';

export type EditableNotesProps = {
    note: string;
    noteSaveStatus: NoteSaveStatus;
    onEditNotes: (jobId: number, notes: string) => void;
    onNotesBlur: (jobId: number) => void;
    onRetryNotes: (jobId: number) => void;
};
