import { Typography } from '@mui/material';
import { Box, SystemStyleObject, Theme } from '@mui/system';
import clsx from 'clsx';
import React, { PropsWithChildren, ReactNode, useMemo } from 'react';
import { ComponentStyleProps } from '../../types/internal/props/component-style-props.type';
import { StyleUtils } from '../../utils/style.utils';
import { LayoutPanel } from './layout-panel.component';

type Props = PropsWithChildren<{
    title?: string;
    titlePosition?: 'outside' | 'inside';
    autoHeight?: boolean;
}> & ComponentStyleProps;

const DefaultTitlePosition = 'outside';

export const StyleClassPrefix = 'LayoutPanelContainer';

const StyleProps = (theme: Theme) => ({
    overflow: 'hidden',
    boxSizing: 'border-box',
    [`& .${StyleClassPrefix}-title`]: {
        fontSize: '1.125rem',
        fontWeight: 'normal',
        padding: theme.spacing(4, 6)
    },
    [`& .${StyleClassPrefix}-contents`]: {
        height: '100%',
        '&.auto-height': {
            height: 'initial',
            maxHeight: '100%'
        }
    }
} as SystemStyleObject<Theme>);

export const LayoutPanelContainer = React.memo((props: Props) => {

    const {
        children,
        title,
        autoHeight,
        className,
        style,
        sx
    } = props;

    const sxProps = useMemo(() => StyleUtils.mergeSxProps(StyleProps, sx), [sx]);

    const titlePosition = props.titlePosition || DefaultTitlePosition;

    const titleNode: ReactNode = title && (
        <Typography variant="h6" className={clsx(`${StyleClassPrefix}-title`, titlePosition)}>
            {title}
        </Typography>
    );

    return (
        <Box
            className={clsx(`${StyleClassPrefix}-root`, className)}
            style={style}
            sx={sxProps}
        >
            {titlePosition === 'outside' && titleNode}
            <LayoutPanel className={clsx(`${StyleClassPrefix}-contents`, autoHeight && 'auto-height')}>
                {titlePosition === 'inside' && titleNode}
                {children}
            </LayoutPanel>
        </Box>
    );

});
