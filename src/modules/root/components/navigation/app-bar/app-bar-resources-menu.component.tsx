import { fade, MenuItem, PaperProps, PopoverOrigin, StyleRules, Theme, withStyles } from '@material-ui/core';
import { HoverMenu } from 'components';
import { WithStylesProps } from 'internal';
import React, { MouseEvent, PureComponent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ThemeConstants } from 'styles';

type Props = {
    open: boolean;
    anchorEl?: Element | null;
} & WithStylesProps;

type State = {
    forceClosed: boolean;
};

const style = (theme: Theme) => ({
    paper: {
        width: '120px'
    },
    link: {
        fontFamily: ThemeConstants.FontFamilyGoogleSans,
        fontWeight: 500,
        color: theme.palette.primary.main,
        lineHeight: '32px',
        '&:hover': {
            background: fade(theme.palette.primary.main, 0.04)
        }
    }
} as StyleRules);

export const AppBarResourcesMenu = withStyles(style)(class extends PureComponent<Props, State> {

    private readonly MenuAnchorOrigin: PopoverOrigin = {
        vertical: 'bottom',
        horizontal: 'right'
    };
    
    private readonly MenuTransformOrigin: PopoverOrigin = {
        vertical: 'top',
        horizontal: 'right'
    };

    private readonly MenuPaperProps: PaperProps = {
        elevation: 1
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            forceClosed: false
        };

        this._handleLinkClick = this._handleLinkClick.bind(this);
    }

    componentDidUpdate() {
        const { open } = this.props;
        if (open) {
            this.setState({
                forceClosed: false
            });
        }
    }

    render(): ReactNode {
        const { classes, open, anchorEl } = this.props;
        const { forceClosed } = this.state;
        return (
            <HoverMenu classes={classes}
                       open={open}
                       anchorEl={anchorEl}
                       getContentAnchorEl={null}
                       transitionDuration={100}
                       forceClosed={forceClosed}
                       anchorOrigin={this.MenuAnchorOrigin}
                       transformOrigin={this.MenuTransformOrigin}
                       PaperProps={this.MenuPaperProps}>
                <MenuItem className={classes.link}
                          component={Link}
                          to="/resources/servants"
                          onClick={this._handleLinkClick}>
                    Servants
                </MenuItem>
                <MenuItem className={classes.link}
                          component={Link}
                          to="/resources/items"
                          onClick={this._handleLinkClick}>
                    Items
                </MenuItem>
                <MenuItem className={classes.link}
                          component={Link}
                          to="/resources/events"
                          onClick={this._handleLinkClick}>
                    Events
                </MenuItem>
            </HoverMenu>
        );
    }

    private _handleLinkClick(event: MouseEvent): void {
        this.setState({
            forceClosed: true
        });
    }

});
