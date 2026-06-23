/**
 * Scroll to and highlight a DOM element, then remove the highlight after 4s.
 * Clears any existing timeout for the same element before applying the new one.
 */
export const scrollAndHighlight = (
    elementId: string,
    highlightClass: string,
    timeouts: Record<string, ReturnType<typeof setTimeout>>
): void => {
    setTimeout(() => {
        if (typeof document === 'undefined') return;

        const element = document.getElementById(elementId);
        if (!element) return;

        const existing = timeouts[elementId];
        if (existing) clearTimeout(existing);

        element.classList.remove(highlightClass);
        if (typeof element.scrollIntoView === 'function') {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        element.classList.add(highlightClass);
        timeouts[elementId] = setTimeout(() => {
            element.classList.remove(highlightClass);
            delete timeouts[elementId];
        }, 4000);
    }, 100);
};
