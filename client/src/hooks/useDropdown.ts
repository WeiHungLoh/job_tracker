import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const VIEWPORT_GUTTER = 8;

const useDropdown = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [alignRight, setAlignRight] = useState(false);
    const closeDropdown = useCallback(() => setIsOpen(false), []);
    const toggleDropdown = useCallback(() => setIsOpen((current) => !current), []);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                closeDropdown();
            }
        };

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeDropdown();
                triggerRef.current?.focus();
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [closeDropdown, isOpen]);

    useLayoutEffect(() => {
        if (!isOpen) {
            return;
        }

        const updateAlignment = () => {
            const dropdown = dropdownRef.current;
            const container = containerRef.current;

            if (!dropdown || !container) {
                return;
            }

            const containerRect = container.getBoundingClientRect();
            const dropdownWidth = dropdown.getBoundingClientRect().width;
            setAlignRight(containerRect.left + dropdownWidth > window.innerWidth - VIEWPORT_GUTTER);
        };

        updateAlignment();
        window.addEventListener('resize', updateAlignment);

        return () => window.removeEventListener('resize', updateAlignment);
    }, [isOpen]);

    return {
        alignRight,
        closeDropdown,
        containerRef,
        dropdownRef,
        isOpen,
        toggleDropdown,
        triggerRef,
    };
};

export default useDropdown;
