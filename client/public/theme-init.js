(function () {
    try {
        var storedTheme = localStorage.getItem('theme');
        var prefersDark =
            typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
        var theme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : prefersDark ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', theme);
    } catch (_) {
        document.documentElement.setAttribute('data-theme', 'light');
    }
})();
