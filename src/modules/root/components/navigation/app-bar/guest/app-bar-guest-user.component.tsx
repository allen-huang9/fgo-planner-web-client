import { StyleRules, Theme, withStyles } from '@material-ui/core';
import { LoginDialog } from 'components';
import { ModalOnCloseReason, WithStylesProps } from 'internal';
import React, { Fragment, PureComponent, ReactNode } from 'react';
import { AppBarLink } from '../app-bar-link.component';
import { AppBarLinks } from '../app-bar-links.component';

type Props = WithStylesProps;

type State = {
    loginModalOpen: boolean;
};

const style = (theme: Theme) => ({
    root: {
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: theme.spacing(0, 4)
    }
} as StyleRules);

/**
 * Renders the app bar contents for a guest (not logged in) user.
 */
export const AppBarGuestUser = withStyles(style)(class extends PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            loginModalOpen: false
        };

        this._openLoginDialog = this._openLoginDialog.bind(this);
        this._handleLoginDialogClose = this._handleLoginDialogClose.bind(this);
    }
 
    render(): ReactNode {
        const styleClasses = this.props.classes;
        return (
            <Fragment>
                <div className={styleClasses.root}>
                    <AppBarLinks>
                        <AppBarLink label="Servants"
                                    route="/resources/servants" />
                        <AppBarLink label="Items"
                                    route="/resources/items" />
                        <AppBarLink label="Events"
                                    route="/resources/events" />
                        <AppBarLink label="Login"
                                    onClick={this._openLoginDialog} />
                    </AppBarLinks>
                </div>
                <LoginDialog open={this.state.loginModalOpen}
                             onClose={this._handleLoginDialogClose}
                />
            </Fragment>
        );
    }

    private _openLoginDialog(): void {
        this.setState({
            loginModalOpen: true
        });
    }

    private _handleLoginDialogClose(event: any, reason: ModalOnCloseReason) {
        this.setState({
            loginModalOpen: false
        });
    }

});
