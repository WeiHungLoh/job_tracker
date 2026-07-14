import { readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const clientRoot = resolve(process.cwd());
const sourceRoot = resolve(clientRoot, 'src');

const readSource = (path: string) => readFileSync(resolve(clientRoot, path), 'utf8');

const collectCssFiles = (directory: string): string[] =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = resolve(directory, entry.name);

        if (entry.isDirectory()) return collectCssFiles(path);
        if (!entry.name.endsWith('.css')) return [];

        return [path];
    });

const countMatches = (source: string, pattern: RegExp) => source.match(pattern)?.length ?? 0;

const countsByFile = (pattern: RegExp) =>
    Object.fromEntries(
        collectCssFiles(sourceRoot)
            .map((path) => [
                relative(clientRoot, path).replaceAll('\\', '/'),
                countMatches(readFileSync(path, 'utf8'), pattern),
            ])
            .filter(([, count]) => count !== 0)
    );

const declarationsByFile = (pattern: RegExp) =>
    Object.fromEntries(
        collectCssFiles(sourceRoot)
            .map((path) => [
                relative(clientRoot, path).replaceAll('\\', '/'),
                (readFileSync(path, 'utf8').match(pattern) ?? []).map((declaration) =>
                    declaration.replace(/\s+/g, ' ').trim()
                ),
            ])
            .filter(([, declarations]) => declarations.length !== 0)
    );

const expectedLinearGradientCounts = {
    'src/components/skeletonLoader/skeletonBoard/SkeletonBoard.module.css': 2,
    'src/components/skeletonLoader/skeletonCard/SkeletonCard.module.css': 1,
    'src/pages/application/applicationBoard/ApplicationBoard.module.css': 6,
};

const expectedRadialGradientCounts = {
    'src/components/loadingSpinner/LoadingSpinner.module.css': 2,
    'src/index.css': 2,
};

const expectedConicGradientCounts = {
    'src/components/loadingSpinner/LoadingSpinner.module.css': 1,
};

const expectedGradientDeclarations = {
    'src/components/loadingSpinner/LoadingSpinner.module.css': [
        'background: conic-gradient( transparent 0 4%, var(--spinnerColor) 4.2% 54%, transparent 54.2% 58%, var(--spinnerTrackColor) 58.2% 100% );',
        '-webkit-mask: radial-gradient( farthest-side, transparent calc(70% - 1px), #000 70%, #000 calc(100% - 1px), transparent 100% );',
        'mask: radial-gradient( farthest-side, transparent calc(70% - 1px), #000 70%, #000 calc(100% - 1px), transparent 100% );',
    ],
    'src/components/skeletonLoader/skeletonBoard/SkeletonBoard.module.css': [
        'background: linear-gradient(180deg, color-mix(in srgb, var(--colorPrimary) 9%, transparent), transparent 120px), var(--colorCardBg);',
        'background: linear-gradient( 90deg, var(--colorSkeletonBase) 25%, var(--colorSkeletonHighlight) 50%, var(--colorSkeletonBase) 75% );',
    ],
    'src/components/skeletonLoader/skeletonCard/SkeletonCard.module.css': [
        'background: linear-gradient( 90deg, var(--colorSkeletonBase) 25%, var(--colorSkeletonHighlight) 50%, var(--colorSkeletonBase) 75% );',
    ],
    'src/index.css': [
        '--colorPublicPageBg: radial-gradient(circle at top left, var(--colorStatIconBg), transparent 45%), var(--colorPageBg);',
        '--colorPublicPageBg: radial-gradient(circle at top left, var(--colorStatIconBg), transparent 45%), var(--colorPageBg);',
    ],
    'src/pages/application/applicationBoard/ApplicationBoard.module.css': [
        '--boardColumnAccent: linear-gradient(var(--boardStatusColor), var(--boardStatusColor)) top / 100% 4px no-repeat;',
        'background: var(--boardColumnAccent), linear-gradient(180deg, color-mix(in srgb, var(--boardStatusColor) 9%, transparent), transparent 120px), var(--colorCardBg);',
        'background: var(--boardColumnAccent), linear-gradient(180deg, color-mix(in srgb, var(--boardStatusColor) 16%, transparent), transparent 120px), var(--colorCardBg);',
        'background: var(--boardColumnAccent), repeating-linear-gradient( 135deg, color-mix(in srgb, var(--colorBtnDestructiveBg) 18%, transparent) 0, color-mix(in srgb, var(--colorBtnDestructiveBg) 18%, transparent) 2px, transparent 2px, transparent 14px ), linear-gradient(180deg, color-mix(in srgb, var(--colorBtnDestructiveBg) 13%, transparent), transparent 120px), var(--colorCardBg);',
        'background: linear-gradient( 180deg, color-mix(in srgb, var(--boardStatusColor) 30%, var(--colorCardBg)), color-mix(in srgb, var(--boardStatusColor) 18%, var(--colorPageBg)) );',
    ],
};

const expectedBoxShadowDeclarations = {
    'src/components/activityControls/ControlDropdown.module.css': [
        'box-shadow: 0 1px 2px var(--colorControlShadow);',
        'box-shadow: 0 3px 8px var(--colorControlShadow);',
        'box-shadow: none;',
        'box-shadow: 0 6px 18px var(--colorAuthCardShadow);',
        'box-shadow: 0 14px 32px var(--colorControlShadow);',
    ],
    'src/components/activityControls/applicationViewToggle/ApplicationViewToggle.module.css': [
        'box-shadow: inset 0 0 0 1px var(--colorControlShadow);',
        'box-shadow: 0 1px 5px var(--colorControlShadow);',
    ],
    'src/components/authProductIntro/AuthProductIntro.module.css': [
        'box-shadow: none;',
        'box-shadow: 0 18px 45px var(--colorAuthCardShadow);',
        'box-shadow: 0 24px 80px rgb(0 0 0 / 45%);',
    ],
    'src/components/fallbackScreen/FallbackScreen.module.css': ['box-shadow: 0 0px 20px var(--colorAuthCardShadow);'],
    'src/components/formPage/FormPage.module.css': ['box-shadow: 0 0 0 3px var(--colorPrimaryFocusShadow);'],
    'src/components/navbar/Navbar.module.css': [
        'box-shadow: 0 2px 8px var(--colorControlShadow);',
        'box-shadow: inset 0 0 0 1px var(--colorControlBorder);',
        'box-shadow: 0 1px 2px var(--colorControlShadow);',
        'box-shadow: 0 3px 8px var(--colorControlShadow);',
    ],
    'src/components/offlineBanner/OfflineBanner.module.css': [
        'box-shadow: 0 18px 42px var(--colorOfflineBannerShadow);',
    ],
    'src/components/toggleButton/ToggleButton.module.css': ['box-shadow: 0 1px 3px rgb(0 0 0 / 24%);'],
    'src/index.css': [
        '-webkit-box-shadow: 0 0 0 1000px #fff inset !important;',
        '-webkit-box-shadow: 0 0 0 1000px #2a2a36 inset !important;',
    ],
    'src/pages/application/ApplicationCard.module.css': [
        'box-shadow: 2px 2px 10px var(--colorNotesShadow);',
        'box-shadow: none;',
    ],
    'src/pages/application/applicationBoard/ApplicationBoard.module.css': [
        'box-shadow: 0 0 0 4px color-mix(in srgb, var(--boardStatusColor) 15%, transparent);',
        'box-shadow: 0 8px 20px var(--colorAuthCardShadow);',
        'box-shadow: 0 12px 26px var(--colorAuthCardShadow);',
        'box-shadow: 0 18px 36px var(--colorAuthCardShadow);',
    ],
    'src/pages/authentication/Authentication.module.css': [
        'box-shadow: 0 20px 48px var(--colorAuthCardShadow);',
        'box-shadow: 0 0 0 3px var(--colorPrimaryFocusShadow);',
    ],
    'src/pages/userGuide/UserGuide.module.css': [
        'box-shadow: 0 14px 38px var(--colorGuideHeaderShadow);',
        'box-shadow: 0 10px 28px var(--colorStatIconBg);',
        'box-shadow: 0 8px 22px var(--colorGuideTipShadow);',
    ],
};

const getThemeBlock = (source: string, theme: 'light' | 'dark') => {
    const startMarker = `[data-theme='${theme}'] {`;
    const endMarker = theme === 'light' ? "[data-theme='dark'] {" : '\n* {';
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start + startMarker.length);

    if (start === -1 || end === -1) throw new Error(`Missing ${theme} theme block`);

    return source.slice(start, end);
};

const getHexToken = (source: string, token: string) => {
    const value = source.match(new RegExp(`--${token}:\\s*(#[0-9a-fA-F]{6});`))?.[1];

    if (!value) throw new Error(`Missing hexadecimal --${token}`);

    return value;
};

const relativeLuminance = (hex: string) => {
    const channels = hex
        .slice(1)
        .match(/.{2}/g)!
        .map((channel) => parseInt(channel, 16) / 255)
        .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));

    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

const contrastRatio = (first: string, second: string) => {
    const firstLuminance = relativeLuminance(first);
    const secondLuminance = relativeLuminance(second);
    const lighter = Math.max(firstLuminance, secondLuminance);
    const darker = Math.min(firstLuminance, secondLuminance);

    return (lighter + 0.05) / (darker + 0.05);
};

describe('Rose Ledger visual contract', () => {
    it('defines both approved palettes and the shared metric aliases', () => {
        const globalCss = readSource('src/index.css');
        const lightCss = getThemeBlock(globalCss, 'light');
        const darkCss = getThemeBlock(globalCss, 'dark');

        [
            '--fontSizeBody: 1rem;',
            '--fontSizeControl: 0.875rem;',
            '--fontSizeCompactControl: 0.8125rem;',
            '--fontSizeMetadata: 0.75rem;',
            '--radiusControl: 10px;',
            '--radiusMenuItem: 8px;',
            '--radiusToolbar: 14px;',
            '--radiusPanel: 15px;',
            '--radiusCard: 16px;',
            '--radiusPill: 999px;',
            '--spaceControl: 8px;',
            '--spaceCompact: 10px;',
            '--spaceCard: 16px;',
            '--spaceSection: 20px;',
            '--spacePageGrid: 24px;',
        ].forEach((declaration) => expect(globalCss).toContain(declaration));

        [
            'color-scheme: light;',
            '--colorPageBg: #f8f4f1;',
            '--colorCardBg: #fffdfb;',
            '--colorText: #2b2529;',
            '--colorTextSecondary: #71666b;',
            '--colorPrimary: #a81f4c;',
            '--colorInteractiveBorder: #987f84;',
            '--colorLinkText: #0b57d0;',
            '--colorAuthLink: #0b57d0;',
            '--colorBtnDestructiveText: #b02a37;',
            '--colorSwitchOff: #987f84;',
            '--colorSwitchOffBorder: #71666b;',
            '--colorSwitchThumb: #ffffff;',
            '--colorSelectedControlText: #ffffff;',
            '--colorBtnDestructiveFilledText: #ffffff;',
            '--colorStatusOfferText: #3b2c00;',
            '--colorStatusAppliedText: #062f35;',
            '--colorStatusInterviewText: #ffffff;',
            '--colorStatusAcceptedText: #ffffff;',
            '--colorStatusRejectedText: #ffffff;',
            '--colorStatusGhostedText: #ffffff;',
            '--colorStatusDeclinedText: #ffffff;',
            '--colorLocationText: #0f5f55;',
            '--colorInterviewType: #4546a8;',
            '--colorUpcomingBadgeText: #ffffff;',
            '--colorScrollbarTrack: #f4eae9;',
            '--colorScrollbarThumb: #a81f4c;',
        ].forEach((declaration) => expect(lightCss).toContain(declaration));

        [
            'color-scheme: dark;',
            '--colorPageBg: #171517;',
            '--colorCardBg: #211e22;',
            '--colorText: #f4edf0;',
            '--colorTextSecondary: #c1b4ba;',
            '--colorPrimary: #ff779b;',
            '--colorInteractiveBorder: #7a6c74;',
            '--colorSelectedControlText: #261019;',
            '--colorBtnDestructiveFilledText: #ffffff;',
            '--colorStatusOfferText: #2c2100;',
            '--colorStatusAppliedText: #041a1d;',
            '--colorStatusInterviewText: #ffffff;',
            '--colorStatusAcceptedText: #ffffff;',
            '--colorStatusRejectedText: #ffffff;',
            '--colorStatusGhostedText: #ffffff;',
            '--colorStatusDeclinedText: #ffffff;',
            '--colorLocationText: #40c9b8;',
            '--colorInterviewType: #8b8dd4;',
            '--colorUpcomingBadgeText: #ffffff;',
            '--colorScrollbarTrack: #2a252a;',
            '--colorScrollbarThumb: #ff779b;',
        ].forEach((declaration) => expect(darkCss).toContain(declaration));

        expect(globalCss).toContain("--fontFamilyBase: 'Quicksand', sans-serif;");
        expect(globalCss).toContain('font-size: var(--fontSizeBody);');
    });

    it.each(['light', 'dark'] as const)('%s theme meets the planned contrast floors', (theme) => {
        const themeCss = getThemeBlock(readSource('src/index.css'), theme);
        const pairs: Array<[string, string, number]> = [
            ['Text', 'PageBg', 4.5],
            ['TextSecondary', 'PageBg', 4.5],
            ['TextSecondary', 'OverlayBg', 3],
            ['Primary', 'OverlayBg', 3],
            ['BtnPrimaryText', 'Primary', 4.5],
            ['BtnDestructiveFilledText', 'BtnDestructiveBg', 4.5],
            ['LinkText', 'LinkBg', 4.5],
            ['AuthLink', 'AuthCardBg', 4.5],
            ['BtnDestructiveText', 'CardBg', 4.5],
            ['SwitchOffBorder', 'CardBg', 3],
            ['SwitchThumb', 'SwitchOff', 3],
            ['InputBorder', 'InputBg', 3],
            ['InteractiveBorder', 'ControlMutedSurface', 3],
            ['PrimaryFocusOutline', 'PageBg', 3],
            ['PrimaryFocusOutline', 'OverlayBg', 3],
            ['LocationText', 'CardBg', 4.5],
            ['InterviewType', 'CardBg', 4.5],
            ['TimeLeft', 'CardBg', 4.5],
            ['ToastErrorText', 'ToastErrorBg', 4.5],
            ['StatusAppliedText', 'StatusApplied', 4.5],
            ['StatusInterviewText', 'StatusInterview', 4.5],
            ['StatusOfferText', 'StatusOffer', 4.5],
            ['StatusAcceptedText', 'StatusAccepted', 4.5],
            ['StatusRejectedText', 'StatusRejected', 4.5],
            ['StatusGhostedText', 'StatusGhosted', 4.5],
            ['StatusDeclinedText', 'StatusDeclined', 4.5],
        ];

        if (theme === 'light') pairs.push(['SwitchOff', 'CardBg', 3]);

        pairs.forEach(([foreground, background, minimum]) =>
            expect(
                contrastRatio(getHexToken(themeCss, `color${foreground}`), getHexToken(themeCss, `color${background}`)),
                `${theme} --color${foreground} on --color${background}`
            ).toBeGreaterThanOrEqual(minimum)
        );
    });

    it('keeps Material UI on the shared font and theme foreground tokens', () => {
        const muiTheme = readSource('src/components/theme/muiTheme.ts');

        expect(muiTheme).toContain("fontFamily: 'var(--fontFamilyBase)'");
        expect(muiTheme).toContain("main: theme === 'dark' ? '#ff779b' : '#a81f4c'");
        expect(muiTheme).toContain("color: 'var(--colorBtnPrimaryText)'");
        expect(muiTheme).toContain("padding: 'var(--spaceControl) var(--spaceCompact)'");
        expect(muiTheme).toContain("borderRadius: 'var(--radiusControl)'");
        expect(countMatches(muiTheme, /boxShadow:/g)).toBe(2);
    });

    it('freezes the connected view toggle, dropdown caret, checkbox, and switch semantics', () => {
        const viewToggle = readSource(
            'src/components/activityControls/applicationViewToggle/ApplicationViewToggle.tsx'
        );
        const dropdown = readSource('src/components/activityControls/ControlDropdown.tsx');
        const checkbox = readSource('src/components/activityControls/checkboxFilter/CheckboxFilter.tsx');
        const toggle = readSource('src/components/toggleButton/ToggleButton.tsx');
        const viewToggleCss = readSource(
            'src/components/activityControls/applicationViewToggle/ApplicationViewToggle.module.css'
        );
        const dropdownCss = readSource('src/components/activityControls/ControlDropdown.module.css');
        const checkboxCss = readSource('src/components/activityControls/checkboxFilter/CheckboxFilter.module.css');
        const toggleCss = readSource('src/components/toggleButton/ToggleButton.module.css');

        expect(viewToggle).toContain('aria-pressed={currentView === viewMode}');
        expect(viewToggle.match(/<button/g)).toHaveLength(1);
        expect(viewToggle).toContain('{VIEW_MODES.map((viewMode) => (');
        expect(dropdown).toContain('styles.chevronOpen');
        expect(dropdown).toContain('aria-expanded={isOpen}');
        expect(checkbox).toContain("type='checkbox'");
        expect(checkbox).toContain('input.indeterminate = someSelected;');
        expect(toggle).toContain("role='switch'");
        expect(toggle).toContain('aria-checked={toggled}');
        expect(viewToggleCss).toContain('display: inline-flex;');
        expect(viewToggleCss).toContain('overflow: hidden;');
        expect(viewToggleCss).toContain('border-right: 1px solid');
        expect(viewToggleCss).toContain('.option:last-child');
        expect(dropdownCss).toContain('.chevronOpen');
        expect(dropdownCss).toContain('transform: rotate(180deg);');
        expect(dropdownCss).toContain('@media (prefers-reduced-motion: reduce)');
        expect(checkboxCss).toContain('.option input {');
        expect(checkboxCss).toContain('clip-path: inset(50%);');
        expect(checkboxCss).toContain('.option input:checked + .checkbox');
        expect(checkboxCss).toContain('.option input:focus-visible + .checkbox');
        expect(toggleCss).toContain('.switch.toggled');
        expect(toggleCss).toContain('translate3d(var(--switch-thumb-translate), -50%, 0)');
        expect(toggleCss).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('freezes all three application notes layouts', () => {
        const applicationCard = readSource('src/pages/application/ApplicationCard.module.css');
        const applicationCardComponent = readSource('src/pages/application/ApplicationCard.tsx');
        const mediumStart = applicationCard.indexOf('@media (min-width: 804px) and (max-width: 1422px)');
        const mobileStart = applicationCard.indexOf('@media (max-width: 803px)');
        const desktopRules = applicationCard.slice(0, mediumStart);
        const mediumRules = applicationCard.slice(mediumStart, mobileStart);
        const mobileRules = applicationCard.slice(mobileStart);

        expect(mediumStart).toBeGreaterThan(0);
        expect(mobileStart).toBeGreaterThan(mediumStart);
        expect(desktopRules).toContain('position: absolute;');
        expect(desktopRules).toContain('right: -330px;');
        expect(desktopRules).toContain('width: 300px;');
        expect(desktopRules).toContain('height: 89%;');
        expect(desktopRules).toContain('width: 500px;');
        expect(desktopRules).toContain('width: 190px;');
        expect(desktopRules).toContain('top: 15px;');
        expect(mediumRules).toContain('flex-wrap: wrap;');
        expect(mediumRules).toContain('flex: 1 1 500px;');
        expect(mediumRules).toContain('width: auto;');
        expect(mediumRules).toContain('min-width: 0;');
        expect(mediumRules).toContain('flex: 1 0 100%;');
        expect(mediumRules).toContain('margin-top: 16px;');
        expect(mediumRules).toContain('position: static;');
        expect(mediumRules).toContain('width: 100%;');
        expect(mediumRules).toContain('height: 160px;');
        expect(mobileRules).toContain('overflow-x: auto;');
        expect(mobileRules).toContain('-webkit-overflow-scrolling: touch;');
        expect(mobileRules).toContain('padding-right: 0;');
        expect(mobileRules).toContain('gap: 8px;');
        expect(mobileRules).toContain('grid-template-columns: 1fr;');
        expect(mobileRules).toContain('width: auto;');
        expect(mobileRules).toContain('padding-right: 16px;');
        expect(mobileRules).toContain('padding-left: 24px;');
        expect(mobileRules).toContain('right: -316px;');
        expect(mobileRules).toContain('top: 0;');
        expect(mobileRules).toContain('height: 100%;');
        expect(mobileRules).toContain('border: none;');
        expect(mobileRules).toContain('border-top-left-radius: 0;');
        expect(mobileRules).toContain('border-bottom-left-radius: 0;');

        const detailsIndex = applicationCardComponent.indexOf('styles.applicationContent');
        const actionsIndex = applicationCardComponent.indexOf('styles.buttonGroup');
        const notesIndex = applicationCardComponent.indexOf('styles.notes');

        expect(detailsIndex).toBeGreaterThan(0);
        expect(actionsIndex).toBeGreaterThan(detailsIndex);
        expect(notesIndex).toBeGreaterThan(actionsIndex);
    });

    it('freezes the other responsive layout boundaries', () => {
        const activityControls = readSource('src/components/activityControls/ActivityControls.module.css');
        const navbar = readSource('src/components/navbar/Navbar.module.css');
        const dashboard = readSource('src/pages/dashboard/Dashboard.module.css');
        const formPage = readSource('src/components/formPage/FormPage.module.css');
        const authProductIntro = readSource('src/components/authProductIntro/AuthProductIntro.module.css');

        [
            '@media (max-width: 803px)',
            '@media (max-width: 600px)',
            '@media (max-width: 350px)',
            '@media (max-width: 290px)',
            '@container (max-width: 610px)',
            '@container (max-width: 435px)',
            '@container (max-width: 425px)',
            '@container (max-width: 350px)',
            '@container (max-width: 285px)',
            'grid-row: 1;',
            'grid-row: 2;',
            'grid-column: 1 / 3;',
        ].forEach((declaration) => expect(activityControls).toContain(declaration));

        ['@media (max-width: 1150px)', '@media (max-width: 600px)', '@media (max-width: 430px)'].forEach(
            (declaration) => expect(navbar).toContain(declaration)
        );
        [
            '@media (max-width: 900px)',
            '@media (max-width: 768px)',
            'grid-column: span 8;',
            'grid-column: span 4;',
        ].forEach((declaration) => expect(dashboard).toContain(declaration));
        expect(formPage).toContain('@media (max-width: 1150px) and (orientation: portrait), (max-width: 600px)');
        expect(formPage).toContain('flex-wrap: nowrap;');
        expect(formPage).toContain('flex: 1 1 0;');
        [
            'grid-template-columns: minmax(0, 1fr) minmax(360px, 400px);',
            'left: calc(200px - 50cqw);',
            '@media (max-width: 900px)',
            '@media (max-width: 600px)',
            'grid-template-rows: 0fr auto;',
        ].forEach((declaration) => expect(authProductIntro).toContain(declaration));
    });

    it('keeps carousel dots and their focus indicator visible', () => {
        const authProductIntro = readSource('src/components/authProductIntro/AuthProductIntro.module.css');
        const inactiveDotStart = authProductIntro.indexOf('.carouselDot {');
        const activeDotStart = authProductIntro.indexOf('.activeCarouselDot {');
        const activeDotEnd = authProductIntro.indexOf('.visuallyHidden {', activeDotStart);
        const inactiveDotRules = authProductIntro.slice(inactiveDotStart, activeDotStart);
        const activeDotRules = authProductIntro.slice(activeDotStart, activeDotEnd);

        expect(inactiveDotStart).toBeGreaterThan(0);
        expect(activeDotStart).toBeGreaterThan(inactiveDotStart);
        expect(activeDotEnd).toBeGreaterThan(activeDotStart);
        expect(inactiveDotRules).toContain('background-color: var(--colorTextSecondary);');
        expect(inactiveDotRules).not.toContain('opacity: 0.45;');
        expect(activeDotRules).toContain('background-color: var(--colorPrimary);');
        expect(activeDotRules).toContain('opacity: 1;');
        expect(authProductIntro).toContain('.carouselDot:focus-visible {\n    outline-offset: 2px;\n}');
    });

    it('keeps application actions single-line and the card scrollbar native', () => {
        const applicationCard = readSource('src/pages/application/ApplicationCard.module.css');
        const applicationBoard = readSource('src/pages/application/applicationBoard/ApplicationBoard.module.css');

        ['Applied', 'Interview', 'Offer', 'Accepted', 'Rejected', 'Ghosted', 'Declined'].forEach((status) =>
            expect(`${applicationCard}\n${applicationBoard}`).toContain(`var(--colorStatus${status}Text)`)
        );
        expect(applicationCard).toContain('border-radius: var(--radiusPill);');
        expect(applicationCard).toMatch(/\.buttonGroup button\s*\{[^}]*white-space: nowrap;/s);
        expect(applicationCard).not.toContain(
            'scrollbar-color: var(--colorScrollbarThumb) var(--colorScrollbarTrack);'
        );
        expect(applicationCard).not.toContain('.application::-webkit-scrollbar-track');
        expect(applicationCard).not.toContain('.application::-webkit-scrollbar-thumb');
        expect(applicationBoard).toContain('border-radius: var(--radiusPill);');
        expect(applicationBoard).toContain('scrollbar-color: var(--colorScrollbarThumb) var(--colorScrollbarTrack);');
        expect(applicationBoard).toContain('.board::-webkit-scrollbar-thumb');
    });

    it('does not expand the existing linear-gradient inventory', () => {
        expect(countsByFile(/linear-gradient\(/g)).toEqual(expectedLinearGradientCounts);
    });

    it('does not expand the existing radial or conic gradient inventory', () => {
        expect(countsByFile(/radial-gradient\(/g)).toEqual(expectedRadialGradientCounts);
        expect(countsByFile(/conic-gradient\(/g)).toEqual(expectedConicGradientCounts);

        const globalCss = readSource('src/index.css');
        expect(
            countMatches(
                globalCss,
                /--colorPublicPageBg:\s*radial-gradient\(circle at top left, var\(--colorStatIconBg\), transparent 45%\),\s*var\(--colorPageBg\);/g
            )
        ).toBe(2);
    });

    it('preserves every existing gradient declaration and stop', () => {
        expect(declarationsByFile(/^\s*[-\w]+:\s*[^;]*gradient\([^;]+;/gm)).toEqual(expectedGradientDeclarations);
    });

    it('does not expand or remove the existing box-shadow inventory', () => {
        const globalCss = readSource('src/index.css');
        const lightCss = getThemeBlock(globalCss, 'light');
        const darkCss = getThemeBlock(globalCss, 'dark');

        [
            '--colorControlBorder: #ead7de;',
            '--colorPrimaryFocusShadow: rgb(241 53 109 / 12%);',
            '--colorControlShadow: rgb(74 40 54 / 10%);',
            '--colorAuthCardShadow: rgb(64 32 48 / 10%);',
            '--colorNotesShadow: rgba(0, 0, 0, 0.1);',
            '--colorToastShadow: rgb(61 35 48 / 18%);',
            '--colorOfflineBannerShadow: rgb(0 64 133 / 16%);',
            '--colorGuideHeaderShadow: rgb(91 42 59 / 8%);',
            '--colorGuideTipShadow: rgb(91 42 59 / 6%);',
            '--colorStatIconBg: rgb(241 53 109 / 10%);',
        ].forEach((declaration) => expect(lightCss).toContain(declaration));

        [
            '--colorControlBorder: #3a3a48;',
            '--colorPrimaryFocusShadow: rgb(244 80 126 / 16%);',
            '--colorControlShadow: rgb(0 0 0 / 30%);',
            '--colorAuthCardShadow: rgb(0 0 0 / 30%);',
            '--colorNotesShadow: rgba(0, 0, 0, 0.3);',
            '--colorToastShadow: rgb(0 0 0 / 42%);',
            '--colorOfflineBannerShadow: rgb(0 0 0 / 28%);',
            '--colorGuideHeaderShadow: rgb(0 0 0 / 20%);',
            '--colorGuideTipShadow: rgb(0 0 0 / 20%);',
            '--colorStatIconBg: rgb(244 80 126 / 16%);',
        ].forEach((declaration) => expect(darkCss).toContain(declaration));

        expect(declarationsByFile(/^\s*(?:-webkit-)?box-shadow\s*:[^;]+;/gm)).toEqual(expectedBoxShadowDeclarations);
    });

    it('completes the shared button, form, and menu visual contracts', () => {
        const button = readSource('src/components/button/PrimaryButton.module.css');
        const form = readSource('src/components/formPage/FormPage.module.css');
        const activityControls = readSource('src/components/activityControls/ActivityControls.module.css');
        const controlDropdown = readSource('src/components/activityControls/ControlDropdown.module.css');
        const viewToggle = readSource(
            'src/components/activityControls/applicationViewToggle/ApplicationViewToggle.module.css'
        );
        const navbar = readSource('src/components/navbar/Navbar.module.css');
        const sortOptions = readSource('src/components/activityControls/sortOptions/SortOptions.module.css');
        const moreOptions = readSource('src/components/activityControls/moreOptions/MoreOptions.module.css');

        expect(button).toContain('.button:focus-visible');
        expect(button).toContain('.button:disabled:not(.loading)');
        expect(button).toContain('opacity: 0.58;');
        expect(button).toContain('.primary:not(:disabled):hover');
        expect(button).toContain('.secondary:not(:disabled):hover');
        expect(button).toContain('.destructive:not(:disabled):hover');
        expect(button).not.toContain('.form:hover');
        expect(button).toContain('--colorSpinnerLight: var(--colorBtnPrimaryText);');
        expect(button).toContain('--colorSpinnerLight: var(--colorBtnDestructiveFilledText);');
        expect(button).toContain('line-height: normal;');
        expect(form).toContain('font-weight: 600;');
        expect(form).toContain('appearance: auto;');
        [activityControls, controlDropdown, viewToggle, navbar].forEach((source) =>
            expect(source).toContain('var(--colorInteractiveBorder)')
        );
        expect(navbar).toContain('box-shadow: inset 0 0 0 1px var(--colorControlBorder);');
        expect(sortOptions).toContain('border-radius: var(--radiusMenuItem);');
        expect(moreOptions).toContain('border-radius: var(--radiusMenuItem);');
    });
});
