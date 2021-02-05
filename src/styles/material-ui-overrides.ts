import { ThemeOptions } from '@material-ui/core';
import { ThemeConstants } from './theme-constants';

const spacing = (scale: number) => {
    return `${ThemeConstants.Spacing * scale}px`;
};

const overrides: ThemeOptions['overrides'] = {
    MuiButton: {
        label: {
            fontFamily: ThemeConstants.FontFamilyGoogleSans,
            fontSize: '1rem',
            textTransform: 'none'
        }
    },
    MuiDialogTitle: {
        root: {
            '& >*': {
                fontFamily: ThemeConstants.FontFamilyGoogleSans
            }
        }
    },
    MuiTextField: {
        root: {
            // margin: spacing(3)
        }
    }
};

export default overrides;
