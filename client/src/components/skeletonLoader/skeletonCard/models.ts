export type SkeletonCardVariant = 'application' | 'interview';

export type SkeletonCardProps = {
    announceLoading?: boolean;
    layout?: 'list' | 'board';
    variant: SkeletonCardVariant;
};
