import { Theme } from '@mui/material';
import { CSSInterpolation, MuiStyledOptions, styled, Theme as SystemTheme } from '@mui/system';
import { ThemeConstants } from '../../styles/theme-constants';

const StyleOptions = {
    skipSx: true,
    skipVariantsResolver: true
} as MuiStyledOptions;

const StyleProps = (props: { theme: SystemTheme }) => {

    const { spacing } = props.theme as Theme;

    return {
        fontFamily: ThemeConstants.FontFamilyGoogleSans,
        fontWeight: 500,
        fontSize: '1.25rem',
        lineHeight: 1.6,
        letterSpacing: '0.0075em',
        paddingTop: spacing(4),
        paddingRight: spacing(6),
        paddingLeft: spacing(6)
    } as CSSInterpolation;
};

export const PageTitle = styled('div', StyleOptions)(StyleProps);
