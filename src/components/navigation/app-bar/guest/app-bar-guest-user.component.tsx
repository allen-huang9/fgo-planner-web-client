import { IconButton, PaperProps, Theme } from '@mui/material';
import { StyleRules, WithStylesOptions } from '@mui/styles';
import makeStyles from '@mui/styles/makeStyles';
import { NightsStay as NightsStayIcon, VolumeOff as VolumeOffIcon, VolumeUp as VolumeUpIcon, WbSunny as WbSunnyIcon } from '@mui/icons-material';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { BackgroundMusicService } from '../../../../services/audio/background-music.service';
import { ThemeInfo, ThemeService } from '../../../../services/user-interface/theme.service';
import { ModalOnCloseReason } from '../../../../types/internal';
import { LoginDialog } from '../../../login/login-dialog.component';
import { AppBarLink } from '../app-bar-link.component';
import { AppBarLinks } from '../app-bar-links.component';

const LoginDialogPaperProps: PaperProps = { 
    style: { 
        minWidth: 360 
    } 
};

const style = (theme: Theme) => ({
    root: {
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: theme.spacing(0, 4)
    }
} as StyleRules);

const styleOptions: WithStylesOptions<Theme> = {
    classNamePrefix: 'AppBarGuestUser'
};

const useStyles = makeStyles(style, styleOptions);

/**
 * Renders the app bar contents for a guest (not logged in) user.
 */
export const AppBarGuestUser = React.memo(() => {
    const classes = useStyles();
    const location = useLocation();
    const history = useHistory();

    const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
    const [themeInfo, setThemeInfo] = useState<ThemeInfo>();
    const [isBackgroundMusicPlaying, setBackgroundMusicPlaying] = useState<boolean>();

    useEffect(() => {
        const onThemeChangeSubscription = ThemeService.onThemeChange
            .subscribe(setThemeInfo);
        const onPlayStatusChangeSubscription = BackgroundMusicService.onPlayStatusChange
            .subscribe(setBackgroundMusicPlaying);

        return () => {
            onThemeChangeSubscription.unsubscribe();
            onPlayStatusChangeSubscription.unsubscribe();
        };
    }, []);

    const openLoginDialog = useCallback((): void => {
        const pathname = location.pathname;
        /*
         * If the user is on a resources page, then show the dialog for logging in
         * instead of redirecting to the login page. This is so the user can continue
         * to view the resource page after logging in without interruption.
         * 
         * TODO Maybe this is not a good idea...
         */
        if (pathname?.includes('resources')) {
            setLoginModalOpen(true);
        } else {
            history.push('/login');
        }
    }, [location.pathname, history]);

    const handleLoginDialogClose = useCallback((event: any, reason: ModalOnCloseReason): void => {
        setLoginModalOpen(false);
    }, []);

    const isLinkActive = (route: string, exact?: boolean): boolean => {
        if (!route) {
            return false;
        }
        if (exact) {
            return location?.pathname === route;
        } else {
            return location?.pathname.startsWith(route);
        }
    };

    return (
        <Fragment>
            <div className={classes.root}>
                <AppBarLinks>
                    <AppBarLink
                        label="Servants"
                        route="/resources/servants"
                        active={isLinkActive('/resources/servants') && !loginModalOpen}
                    />
                    <AppBarLink
                        label="Items"
                        route="/resources/items"
                        active={isLinkActive('/resources/items') && !loginModalOpen}
                    />
                    <AppBarLink
                        label="Events"
                        route="/resources/events"
                        active={isLinkActive('/resources/events') && !loginModalOpen}
                    />
                    <AppBarLink
                        label="Login"
                        onClick={openLoginDialog}
                        active={isLinkActive('/login') || loginModalOpen}
                    />
                </AppBarLinks>
                <IconButton
                    onClick={() => ThemeService.toggleThemeMode()}
                    children={themeInfo?.themeMode === 'light' ? <WbSunnyIcon /> : <NightsStayIcon />}
                    size="large" />
                <IconButton
                    onClick={() => isBackgroundMusicPlaying ? BackgroundMusicService.pause() : BackgroundMusicService.play()}
                    children={isBackgroundMusicPlaying ? <VolumeUpIcon /> : <VolumeOffIcon />}
                    size="large" />
            </div>
            <LoginDialog
                PaperProps={LoginDialogPaperProps}
                open={loginModalOpen}
                onClose={handleLoginDialogClose}
            />
        </Fragment>
    );

});
