import { createTheme, IDatePickerStrings, IDatePickerStyles, ITextFieldProps, mergeStyleSets } from "office-ui-fabric-react";

export const DatePickerStrings: IDatePickerStrings = {
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shortDays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    goToToday: 'Go to today',
    prevMonthAriaLabel: 'Go to previous month',
    nextMonthAriaLabel: 'Go to next month',
    prevYearAriaLabel: 'Go to previous year',
    nextYearAriaLabel: 'Go to next year',
    closeButtonAriaLabel: 'Close date picker'
};

export const DatePickerControlClass = mergeStyleSets({
    control: {
        margin: '0 8px 15px 0',
        maxWidth: '300px'
    }
});

// Azure DevOps theme variables (with light theme fallbacks), so the Office UI
// date picker follows the selected Azure DevOps theme like the azure-devops-ui controls.
const textPrimary = 'var(--text-primary-color, rgba(0, 0, 0, .9))';
const textSecondary = 'var(--text-secondary-color, rgba(0, 0, 0, .55))';
const textDisabled = 'var(--text-disabled-color, rgba(0, 0, 0, .38))';
const accent = 'var(--communication-background, rgba(0, 120, 212, 1))';
const accentDark = 'var(--communication-foreground, rgba(0, 90, 158, 1))';
const accentAlpha = (alpha: number) => `rgba(var(--palette-primary, 0, 120, 212), ${alpha})`;
const border = 'rgba(var(--palette-neutral-20, 200, 200, 200), 1)';

export const DatePickerTheme = createTheme({
    palette: {
        themePrimary: accent,
        themeDarkAlt: accentDark,
        themeDark: accentDark,
        themeDarker: accentDark,
        themeSecondary: accentAlpha(0.8),
        themeTertiary: accentAlpha(0.5),
        themeLight: accentAlpha(0.3),
        themeLighter: accentAlpha(0.15),
        themeLighterAlt: accentAlpha(0.08),
        black: textPrimary,
        neutralDark: textPrimary,
        neutralPrimary: textPrimary,
        neutralPrimaryAlt: textPrimary,
        neutralSecondary: textSecondary,
        neutralSecondaryAlt: textDisabled,
        neutralTertiary: textDisabled,
        neutralTertiaryAlt: border,
        neutralQuaternary: border,
        neutralQuaternaryAlt: 'var(--palette-black-alpha-10, rgba(0, 0, 0, 0.10))',
        neutralLight: 'var(--palette-black-alpha-10, rgba(0, 0, 0, 0.10))',
        neutralLighter: 'var(--palette-black-alpha-6, rgba(0, 0, 0, 0.06))',
        neutralLighterAlt: 'var(--palette-black-alpha-2, rgba(0, 0, 0, 0.02))',
        white: 'var(--callout-background-color, rgba(255, 255, 255, 1))'
    },
    semanticColors: {
        inputBackground: 'var(--background-color, rgba(255, 255, 255, 1))',
        inputBorder: textSecondary,
        inputBorderHovered: textPrimary,
        inputFocusBorderAlt: accent,
        inputText: textPrimary,
        inputPlaceholderText: textSecondary
    },
    defaultFontStyle: {
        fontFamily: 'inherit'
    }
});

// Fixed width that fits the formatted date, so the text doesn't run under the calendar icon
export const DatePickerStyles: Partial<IDatePickerStyles> = {
    root: {
        width: 180,
        flexShrink: 0
    }
};

export const DatePickerTextFieldProps: ITextFieldProps = {
    styles: {
        fieldGroup: {
            height: 32,
            borderRadius: 2
        },
        field: {
            fontSize: 14,
            paddingRight: 32,
            textOverflow: 'ellipsis'
        }
    }
};
