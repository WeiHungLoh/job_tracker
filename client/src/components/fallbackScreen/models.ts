export type FallbackScreenVariant = 'authenticationError' | 'loading' | 'notFound';

export type FallbackScreenProps = {
    variant?: FallbackScreenVariant;
    onAction?: () => void;
};
