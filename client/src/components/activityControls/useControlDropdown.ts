import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const VIEWPORT_GUTTER = 8;
const DROPDOWN_GAP = 8;

const useControlDropdown = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownOffset, setDropdownOffset] = useState(0);
    const [dropdownMaxHeight, setDropdownMaxHeight] = useState<number | null>(null);
    const [openAbove, setOpenAbove] = useState(false);
    const closeDropdown = useCallback(() => {
        setIsOpen(false);
        setDropdownMaxHeight(null);
        setDropdownOffset(0);
        setOpenAbove(false);
    }, []);
    const toggleDropdown = useCallback(() => {
        setIsOpen((current) => !current);
        setDropdownMaxHeight(null);
        setDropdownOffset(0);
        setOpenAbove(false);
    }, []);

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

        const updatePosition = () => {
            const dropdown = dropdownRef.current;
            const container = containerRef.current;

            if (!dropdown || !container) {
                return;
            }

            const containerRect = container.getBoundingClientRect();
            const dropdownRect = dropdown.getBoundingClientRect();
            const dropdownWidth = dropdownRect.width;
            const viewportRight = window.innerWidth - VIEWPORT_GUTTER;
            const rightAlignedLeft = containerRect.right - dropdownWidth;
            const preferredLeft =
                containerRect.left + dropdownWidth <= viewportRight ? containerRect.left : rightAlignedLeft;
            const maximumLeft = Math.max(VIEWPORT_GUTTER, viewportRight - dropdownWidth);
            const clampedLeft = Math.min(Math.max(preferredLeft, VIEWPORT_GUTTER), maximumLeft);

            setDropdownOffset(clampedLeft - containerRect.left);

            const availableBelow = Math.max(
                0,
                window.innerHeight - VIEWPORT_GUTTER - containerRect.bottom - DROPDOWN_GAP
            );
            const availableAbove = Math.max(0, containerRect.top - VIEWPORT_GUTTER - DROPDOWN_GAP);
            const shouldOpenAbove = dropdownRect.height > availableBelow && availableAbove > availableBelow;

            setOpenAbove(shouldOpenAbove);
            setDropdownMaxHeight(Math.floor(shouldOpenAbove ? availableAbove : availableBelow));
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen]);

    return {
        closeDropdown,
        containerRef,
        dropdownMaxHeight,
        dropdownOffset,
        dropdownRef,
        isOpen,
        openAbove,
        toggleDropdown,
        triggerRef,
    };
};

export default useControlDropdown;
