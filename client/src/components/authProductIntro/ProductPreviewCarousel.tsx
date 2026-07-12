import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, Ref } from 'react';
import { createPortal } from 'react-dom';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import darkBoardApplicationPreview from '../../../images/dark-board-application.png';
import darkBoardArchivedApplicationPreview from '../../../images/dark-board-archived-application.png';
import darkBoardArchivedInterviewPreview from '../../../images/dark-board-archived-interview.png';
import darkBoardInterviewPreview from '../../../images/dark-board-interview.png';
import darkDashboardPreview from '../../../images/dark-dashboard.png';
import darkListApplicationPreview from '../../../images/dark-list-application.png';
import darkListArchivedApplicationPreview from '../../../images/dark-list-archived-application.png';
import darkListArchivedInterviewPreview from '../../../images/dark-list-archived-interview.png';
import darkListInterviewPreview from '../../../images/dark-list-interview.png';
import lightBoardApplicationPreview from '../../../images/light-board-application.png';
import lightBoardArchivedApplicationPreview from '../../../images/light-board-archived-application.png';
import lightBoardArchivedInterviewPreview from '../../../images/light-board-archived-interview.png';
import lightBoardInterviewPreview from '../../../images/light-board-interview.png';
import lightDashboardPreview from '../../../images/light-dashboard.png';
import lightListApplicationPreview from '../../../images/light-list-application.png';
import lightListArchivedApplicationPreview from '../../../images/light-list-archived-application.png';
import lightListArchivedInterviewPreview from '../../../images/light-list-archived-interview.png';
import lightListInterviewPreview from '../../../images/light-list-interview.png';
import LoadingSpinner from '../loadingSpinner/LoadingSpinner';
import { routes } from '../../routes';
import type { Theme } from '../theme/models';
import { useTheme } from '../theme/ThemeContext';
import styles from './AuthProductIntro.module.css';

const PRODUCT_HOST = 'jobtracker.weihungloh.com';

const productPreviews = [
    {
        alt: 'Job Tracker dashboard showing application and interview statistics',
        darkImage: darkDashboardPreview,
        label: 'Dashboard',
        lightImage: lightDashboardPreview,
        route: routes.dashboard,
    },
    {
        alt: 'Job Tracker application list showing applications, statuses, interviews and notes',
        darkImage: darkListApplicationPreview,
        label: 'List application',
        lightImage: lightListApplicationPreview,
        route: routes.viewApplications,
    },
    {
        alt: 'Job Tracker application board showing applications grouped by status',
        darkImage: darkBoardApplicationPreview,
        label: 'Board application',
        lightImage: lightBoardApplicationPreview,
        route: routes.viewApplications,
    },
    {
        alt: 'Job Tracker interview list showing scheduled job interviews',
        darkImage: darkListInterviewPreview,
        label: 'List interview',
        lightImage: lightListInterviewPreview,
        route: routes.viewInterviews,
    },
    {
        alt: 'Job Tracker interview board showing scheduled job interviews',
        darkImage: darkBoardInterviewPreview,
        label: 'Board interview',
        lightImage: lightBoardInterviewPreview,
        route: routes.viewInterviews,
    },
    {
        alt: 'Job Tracker archived application list',
        darkImage: darkListArchivedApplicationPreview,
        label: 'List archived application',
        lightImage: lightListArchivedApplicationPreview,
        route: routes.archivedApplications,
    },
    {
        alt: 'Job Tracker archived application board',
        darkImage: darkBoardArchivedApplicationPreview,
        label: 'Board archived application',
        lightImage: lightBoardArchivedApplicationPreview,
        route: routes.archivedApplications,
    },
    {
        alt: 'Job Tracker archived interview list',
        darkImage: darkListArchivedInterviewPreview,
        label: 'List archived interview',
        lightImage: lightListArchivedInterviewPreview,
        route: routes.archivedInterviews,
    },
    {
        alt: 'Job Tracker archived interview board',
        darkImage: darkBoardArchivedInterviewPreview,
        label: 'Board archived interview',
        lightImage: lightBoardArchivedInterviewPreview,
        route: routes.archivedInterviews,
    },
] as const;

type ProductPreview = (typeof productPreviews)[number];

const loadedPreviewImages = new Set<string>();
const previewImageRequests = new Map<string, Promise<void>>();

const canPreloadPreviewImages = () =>
    typeof window !== 'undefined' &&
    typeof Image !== 'undefined' &&
    !window.navigator.userAgent.toLowerCase().includes('jsdom');

const getPreviewImage = (preview: ProductPreview, theme: Theme) =>
    theme === 'dark' ? preview.darkImage : preview.lightImage;

const preloadPreviewImage = (src: string) => {
    if (loadedPreviewImages.has(src)) {
        return Promise.resolve();
    }

    if (!canPreloadPreviewImages()) {
        loadedPreviewImages.add(src);
        return Promise.resolve();
    }

    const existingRequest = previewImageRequests.get(src);
    if (existingRequest) {
        return existingRequest;
    }

    const request = new Promise<void>((resolve) => {
        const image = new Image();

        const complete = () => {
            loadedPreviewImages.add(src);
            previewImageRequests.delete(src);
            resolve();
        };

        image.onload = () => {
            if (typeof image.decode === 'function') {
                void image.decode().then(complete, complete);
            } else {
                complete();
            }
        };
        image.onerror = complete;
        image.src = src;
    });

    previewImageRequests.set(src, request);
    return request;
};

const getAdjacentPreviewIndexes = (activeIndex: number) => [
    activeIndex,
    (activeIndex - 1 + productPreviews.length) % productPreviews.length,
    (activeIndex + 1) % productPreviews.length,
];

type CarouselControlsProps = {
    activeIndex: number;
    isNavigationLoading: boolean;
    onSelect: (index: number) => void;
    onShowNext: () => void;
    onShowPrevious: () => void;
};

const CarouselControls = memo(
    ({ activeIndex, isNavigationLoading, onSelect, onShowNext, onShowPrevious }: CarouselControlsProps) => (
        <div className={styles.carouselControls}>
            <button
                type='button'
                className={styles.carouselArrow}
                onClick={onShowPrevious}
                disabled={isNavigationLoading}
            >
                <MdChevronLeft className={styles.carouselArrowIcon} aria-hidden='true' focusable='false' />
                <span className={styles.visuallyHidden}>Previous preview</span>
            </button>

            <div className={styles.carouselDots} aria-label='Jump to a product preview'>
                {productPreviews.map((preview, index) => (
                    <button
                        key={preview.label}
                        type='button'
                        className={`${styles.carouselDot} ${index === activeIndex ? styles.activeCarouselDot : ''}`}
                        onClick={() => onSelect(index)}
                        disabled={isNavigationLoading}
                        aria-label={`Jump to ${preview.label}`}
                        aria-current={index === activeIndex ? 'true' : undefined}
                    />
                ))}
            </div>

            <button type='button' className={styles.carouselArrow} onClick={onShowNext} disabled={isNavigationLoading}>
                <MdChevronRight className={styles.carouselArrowIcon} aria-hidden='true' focusable='false' />
                <span className={styles.visuallyHidden}>Next preview</span>
            </button>
        </div>
    )
);

CarouselControls.displayName = 'CarouselControls';

type PreviewFrameProps = {
    activeIndex: number;
    imageButtonRef?: Ref<HTMLButtonElement>;
    isNavigationLoading: boolean;
    isFullscreen?: boolean;
    onImageClick?: () => void;
    onImageLoad: (src: string) => void;
    onSelect: (index: number) => void;
    onShowNext: () => void;
    onShowPrevious: () => void;
    theme: Theme;
};

const PreviewFrame = memo(
    ({
        activeIndex,
        imageButtonRef,
        isNavigationLoading,
        isFullscreen = false,
        onImageClick,
        onImageLoad,
        onSelect,
        onShowNext,
        onShowPrevious,
        theme,
    }: PreviewFrameProps) => {
        const activePreview = productPreviews[activeIndex];
        const image = getPreviewImage(activePreview, theme);

        return (
            <div className={`${styles.preview} ${isFullscreen ? styles.fullscreenPreview : ''}`}>
                <div className={styles.browserBar} aria-hidden='true'>
                    <span />
                    <span />
                    <span />
                    <div className={styles.browserAddress}>
                        {PRODUCT_HOST}
                        {activePreview.route}
                    </div>
                </div>

                {onImageClick ? (
                    <button
                        ref={imageButtonRef}
                        type='button'
                        className={styles.previewImageButton}
                        onClick={onImageClick}
                        aria-label={`Open ${activePreview.label} preview in fullscreen`}
                    >
                        <img
                            src={image}
                            alt={activePreview.alt}
                            decoding='async'
                            loading='eager'
                            onLoad={() => onImageLoad(image)}
                        />
                        {isNavigationLoading ? (
                            <span className={styles.previewLoadingOverlay}>
                                <LoadingSpinner size={32} title='Loading preview' />
                            </span>
                        ) : null}
                    </button>
                ) : (
                    <div className={styles.fullscreenImageViewport}>
                        <img
                            src={image}
                            alt={activePreview.alt}
                            decoding='async'
                            loading='eager'
                            onLoad={() => onImageLoad(image)}
                        />
                        {isNavigationLoading ? (
                            <span className={styles.previewLoadingOverlay}>
                                <LoadingSpinner size={32} title='Loading preview' variant='light' />
                            </span>
                        ) : null}
                    </div>
                )}

                <CarouselControls
                    activeIndex={activeIndex}
                    isNavigationLoading={isNavigationLoading}
                    onSelect={onSelect}
                    onShowNext={onShowNext}
                    onShowPrevious={onShowPrevious}
                />
            </div>
        );
    }
);

PreviewFrame.displayName = 'PreviewFrame';

const ProductPreviewCarousel = () => {
    const { theme } = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isNavigationLoading, setIsNavigationLoading] = useState(false);
    const [loadedImages, setLoadedImages] = useState(() => new Set(loadedPreviewImages));
    const imageButtonRef = useRef<HTMLButtonElement>(null);
    const navigationRequestIdRef = useRef(0);

    const markImageLoaded = useCallback((src: string) => {
        loadedPreviewImages.add(src);
        setLoadedImages((currentLoadedImages) => {
            if (currentLoadedImages.has(src)) {
                return currentLoadedImages;
            }

            const nextLoadedImages = new Set(currentLoadedImages);
            nextLoadedImages.add(src);
            return nextLoadedImages;
        });
    }, []);

    const preloadImages = useCallback(
        (indexes: number[]) => {
            indexes.forEach((index) => {
                const src = getPreviewImage(productPreviews[index], theme);

                if (!canPreloadPreviewImages()) {
                    loadedPreviewImages.add(src);
                    return;
                }

                void preloadPreviewImage(src).then(() => markImageLoaded(src));
            });
        },
        [markImageLoaded, theme]
    );

    const selectPreview = useCallback(
        (index: number) => {
            if (index === activeIndex || isNavigationLoading) {
                return;
            }

            const nextImage = getPreviewImage(productPreviews[index], theme);

            if (!canPreloadPreviewImages()) {
                loadedPreviewImages.add(nextImage);
                setActiveIndex(index);
                return;
            }

            if (loadedImages.has(nextImage) || loadedPreviewImages.has(nextImage)) {
                setActiveIndex(index);
                return;
            }

            const requestId = navigationRequestIdRef.current + 1;
            navigationRequestIdRef.current = requestId;
            setIsNavigationLoading(true);

            void preloadPreviewImage(nextImage).then(() => {
                if (navigationRequestIdRef.current !== requestId) {
                    return;
                }

                markImageLoaded(nextImage);
                setActiveIndex(index);
                setIsNavigationLoading(false);
            });
        },
        [activeIndex, isNavigationLoading, loadedImages, markImageLoaded, theme]
    );

    const showPreviousPreview = useCallback(() => {
        selectPreview((activeIndex - 1 + productPreviews.length) % productPreviews.length);
    }, [activeIndex, selectPreview]);

    const showNextPreview = useCallback(() => {
        selectPreview((activeIndex + 1) % productPreviews.length);
    }, [activeIndex, selectPreview]);

    const handleCarouselKeyDown = useCallback(
        (event: ReactKeyboardEvent<HTMLDivElement>) => {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                showPreviousPreview();
                return;
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                showNextPreview();
            }
        },
        [showNextPreview, showPreviousPreview]
    );

    const handleOpenFullscreen = useCallback(() => {
        setIsFullscreen(true);
    }, []);

    const closeFullscreen = useCallback(() => {
        setIsFullscreen(false);
        window.setTimeout(() => imageButtonRef.current?.focus(), 0);
    }, []);

    const adjacentPreviewIndexes = useMemo(() => getAdjacentPreviewIndexes(activeIndex), [activeIndex]);

    useEffect(() => {
        preloadImages(adjacentPreviewIndexes);
    }, [adjacentPreviewIndexes, preloadImages]);

    useEffect(() => {
        if (!isFullscreen) {
            return;
        }

        const previousBodyOverflow = document.body.style.overflow;
        const previousDocumentOverflow = document.documentElement.style.overflow;
        const appRoot = document.getElementById('root');
        const previousRootAriaHidden = appRoot?.getAttribute('aria-hidden');
        const wasRootInert = appRoot?.hasAttribute('inert');
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        appRoot?.setAttribute('aria-hidden', 'true');
        appRoot?.setAttribute('inert', '');

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeFullscreen();
                return;
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                showPreviousPreview();
                return;
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                showNextPreview();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousBodyOverflow;
            document.documentElement.style.overflow = previousDocumentOverflow;
            if (!wasRootInert) {
                appRoot?.removeAttribute('inert');
            }
            if (previousRootAriaHidden === null) {
                appRoot?.removeAttribute('aria-hidden');
            } else if (previousRootAriaHidden !== undefined) {
                appRoot?.setAttribute('aria-hidden', previousRootAriaHidden);
            }
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [closeFullscreen, isFullscreen, showNextPreview, showPreviousPreview]);

    return (
        <>
            <div
                className={styles.carouselRegion}
                role='region'
                aria-roledescription='carousel'
                aria-label='Job Tracker product preview'
                onKeyDown={handleCarouselKeyDown}
                tabIndex={0}
            >
                <PreviewFrame
                    activeIndex={activeIndex}
                    imageButtonRef={imageButtonRef}
                    isNavigationLoading={isNavigationLoading}
                    onImageClick={handleOpenFullscreen}
                    onImageLoad={markImageLoaded}
                    onSelect={selectPreview}
                    onShowNext={showNextPreview}
                    onShowPrevious={showPreviousPreview}
                    theme={theme}
                />
            </div>

            {isFullscreen
                ? createPortal(
                      <div
                          className={styles.fullscreenBackdrop}
                          role='dialog'
                          aria-modal='true'
                          aria-label='Job Tracker product preview fullscreen'
                      >
                          <div className={styles.fullscreenClosePosition}>
                              <button
                                  type='button'
                                  className={styles.fullscreenClose}
                                  onClick={closeFullscreen}
                                  aria-label='Close fullscreen preview'
                                  autoFocus
                              >
                                  ×
                              </button>
                          </div>
                          <PreviewFrame
                              activeIndex={activeIndex}
                              isNavigationLoading={isNavigationLoading}
                              isFullscreen
                              onImageLoad={markImageLoaded}
                              onSelect={selectPreview}
                              onShowNext={showNextPreview}
                              onShowPrevious={showPreviousPreview}
                              theme={theme}
                          />
                      </div>,
                      document.body
                  )
                : null}
        </>
    );
};

export default ProductPreviewCarousel;
