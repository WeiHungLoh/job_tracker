import type { ReactNode } from 'react';
import type { IconName } from '../../components/icon/models';

export type UserGuideSection = {
    id: string;
    title: string;
    icon: IconName;
    content: ReactNode;
};
