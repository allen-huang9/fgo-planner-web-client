import { alpha, ThemeOptions } from '@mui/material';
import { pink } from '@mui/material/colors';
import { BreakpointOverrides } from './material-ui-breakpoints';
import { ComponentsOverrides } from './material-ui-components';
import { ThemeConstants } from './theme-constants';

const themeDefaultDark = () => {
    return {
        spacing: ThemeConstants.Spacing,
        palette: {
            mode: 'dark',
            background: {
                default: alpha('#001E3C', 0.91),
                paper: '#1A344F'

            },
            primary: {
                main: '#BADA55'
            },
            secondary: {
                main: pink[200]
            },
            divider: '#001E3C'
        },
        breakpoints: BreakpointOverrides,
        components: ComponentsOverrides
    } as ThemeOptions;
};

export default themeDefaultDark;
