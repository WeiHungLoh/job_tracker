import { useCallback, useEffect, useRef, useState } from 'react';
import type { Ref } from 'react';
import { createPortal } from 'react-dom';
import darkArchivedApplicationPreview from '../../../images/dark-archived-application.png';
import darkArchivedInterviewPreview from '../../../images/dark-archived-interview.png';
import darkDashboardPreview from '../../../images/dark-dashboard.png';
import darkApplicationPreview from '../../../images/dark-view-application.png';
import darkInterviewPreview from '../../../images/dark-view-interview.png';
import lightArchivedApplicationPreview from '../../../images/light-archived-application.png';
import lightArchivedInterviewPreview from '../../../images/light-archived-interview.png';
import lightDashboardPreview from '../../../images/light-dashboard.png';
import lightApplicationPreview from '../../../images/light-view-application.png';
import lightInterviewPreview from '../../../images/light-view-interview.png';
import { routes } from '../../routes';
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
        darkImage: darkApplicationPreview,
        label: 'View application',
        lightImage: lightApplicationPreview,
        route: routes.viewApplications,
    },
    {
        alt: 'Job Tracker interview list showing scheduled job interviews',
        darkImage: darkInterviewPreview,
        label: 'View interview',
        lightImage: lightInterviewPreview,
        route: routes.viewInterviews,
    },
    {
        alt: 'Job Tracker archived application list',
        darkImage: darkArchivedApplicationPreview,
        label: 'Archived application',
        lightImage: lightArchivedApplicationPreview,
        route: routes.archivedApplications,
    },
    {
        alt: 'Job Tracker archived interview list',
        darkImage: darkArchivedInterviewPreview,
        label: 'Archived interview',
        lightImage: lightArchivedInterviewPreview,
        route: routes.archivedInterviews,
    },
] as const;

type CarouselControlsProps = {
    activeIndex: number;
    onSelect: (index: number) => void;
    onShowNext: () => void;
    onShowPrevious: () => void;
};

const CarouselControls = ({ activeIndex, onSelect, onShowNext, onShowPrevious }: CarouselControlsProps) => (
    <div className={styles.carouselControls}>
        <button type='button' className={styles.carouselArrow} onClick={onShowPrevious}>
            <span aria-hidden='true'>‹</span>
            <span className={styles.visuallyHidden}>Previous preview</span>
        </button>

        <div className={styles.carouselDots} aria-label='Jump to a product preview'>
            {productPreviews.map((preview, index) => (
                <button
                    key={preview.route}
                    type='button'
                    className={`${styles.carouselDot} ${index === activeIndex ? styles.activeCarouselDot : ''}`}
                    onClick={() => onSelect(index)}
                    aria-label={`Jump to ${preview.label}`}
                    aria-current={index === activeIndex ? 'true' : undefined}
                />
            ))}
        </div>

        <button type='button' className={styles.carouselArrow} onClick={onShowNext}>
            <span aria-hidden='true'>›</span>
            <span className={styles.visuallyHidden}>Next preview</span>
        </button>
    </div>
);

type PreviewFrameProps = {
    activeIndex: number;
    imageButtonRef?: Ref<HTMLButtonElement>;
    isFullscreen?: boolean;
    onImageClick?: () => void;
    onSelect: (index: number) => void;
    onShowNext: () => void;
    onShowPrevious: () => void;
};

const PreviewFrame = ({
    activeIndex,
    imageButtonRef,
    isFullscreen = false,
    onImageClick,
    onSelect,
    onShowNext,
    onShowPrevious,
}: PreviewFrameProps) => {
    const { theme } = useTheme();
    const activePreview = productPreviews[activeIndex];
    const image = theme === 'dark' ? activePreview.darkImage : activePreview.lightImage;

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
                    <img src={image} alt={activePreview.alt} />
                </button>
            ) : (
                <div className={styles.fullscreenImageViewport}>
                    <img src={image} alt={activePreview.alt} />
                </div>
            )}

            <CarouselControls
                activeIndex={activeIndex}
                onSelect={onSelect}
                onShowNext={onShowNext}
                onShowPrevious={onShowPrevious}
            />
        </div>
    );
};

const ProductPreviewCarousel = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const imageButtonRef = useRef<HTMLButtonElement>(null);

    const showPreviousPreview = () => {
        setActiveIndex((currentIndex) => (currentIndex - 1 + productPreviews.length) % productPreviews.length);
    };

    const showNextPreview = () => {
        setActiveIndex((currentIndex) => (currentIndex + 1) % productPreviews.length);
    };

    const closeFullscreen = useCallback(() => {
        setIsFullscreen(false);
        window.setTimeout(() => imageButtonRef.current?.focus(), 0);
    }, []);

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
    }, [closeFullscreen, isFullscreen]);

    return (
        <>
            <div
                className={styles.carouselRegion}
                role='region'
                aria-roledescription='carousel'
                aria-label='Job Tracker product preview'
            >
                <PreviewFrame
                    activeIndex={activeIndex}
                    imageButtonRef={imageButtonRef}
                    onImageClick={() => setIsFullscreen(true)}
                    onSelect={setActiveIndex}
                    onShowNext={showNextPreview}
                    onShowPrevious={showPreviousPreview}
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
                              isFullscreen
                              onSelect={setActiveIndex}
                              onShowNext={showNextPreview}
                              onShowPrevious={showPreviousPreview}
                          />
                      </div>,
                      document.body
                  )
                : null}
        </>
    );
};

export default ProductPreviewCarousel;
