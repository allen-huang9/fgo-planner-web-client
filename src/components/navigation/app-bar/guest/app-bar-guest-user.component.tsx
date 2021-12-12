import { NightsStay as NightsStayIcon, VolumeOff as VolumeOffIcon, VolumeUp as VolumeUpIcon, WbSunny as WbSunnyIcon } from '@mui/icons-material';
import { IconButton, PaperProps } from '@mui/material';
import { Box, SystemStyleObject, Theme } from '@mui/system';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useInjectable } from '../../../../hooks/dependency-injection/use-injectable.hook';
import { BackgroundMusicService } from '../../../../services/audio/background-music.service';
import { ThemeService } from '../../../../services/user-interface/theme.service';
import { ModalOnCloseReason, Nullable, ThemeInfo } from '../../../../types/internal';
import { SubscribablesContainer } from '../../../../utils/subscription/subscribables-container';
import { SubscriptionTopic } from '../../../../utils/subscription/subscription-topic';
import { LoginDialog } from '../../../login/login-dialog.component';
import { AppBarLink } from '../app-bar-link.component';
import { AppBarLinks } from '../app-bar-links.component';

const LoginDialogPaperProps: PaperProps = {
    style: {
        minWidth: 360
    }
};

// This component does not need StyleClassPrefix.

const StyleProps = {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    px: 4,
    py: 0
} as SystemStyleObject<Theme>;

/**
 * Renders the app bar contents for a guest (not logged in) user.
 */
export const AppBarGuestUser = React.memo(() => {

    const location = useLocation();
    const navigate = useNavigate();

    const backgroundMusicService = useInjectable(BackgroundMusicService);
    const themeService = useInjectable(ThemeService);

    const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
    const [themeInfo, setThemeInfo] = useState<Nullable<ThemeInfo>>();
    const [isBackgroundMusicPlaying, setIsBackgroundMusicPlaying] = useState<boolean>();

    useEffect(() => {
        const onThemeChangeSubscription = SubscribablesContainer
            .get(SubscriptionTopic.UserInterface_ThemeChange)
            .subscribe(setThemeInfo);
        const onPlayStatusChangeSubscription = SubscribablesContainer
            .get(SubscriptionTopic.Audio_BackgroundPlayStatusChange)
            .subscribe(setIsBackgroundMusicPlaying);


        return () => {
            onThemeChangeSubscription.unsubscribe();
            onPlayStatusChangeSubscription.unsubscribe();
        };
    }, []);

    const handleThemeModeToggle = useCallback((): void => {
        themeService.toggleThemeMode();
    }, [themeService]);

    const handleBackgroundMusicButtonClick = useCallback((): void => {
        if (isBackgroundMusicPlaying) {
            backgroundMusicService.pause();
        } else {
            backgroundMusicService.play();
        }
    }, [backgroundMusicService, isBackgroundMusicPlaying]);

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
            navigate('/login');
        }
    }, [location.pathname, navigate]);

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
            <Box sx={StyleProps}>
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
                    onClick={handleThemeModeToggle}
                    children={themeInfo?.themeMode === 'light' ? <WbSunnyIcon /> : <NightsStayIcon />}
                    size="large" />
                <IconButton
                    onClick={handleBackgroundMusicButtonClick}
                    children={isBackgroundMusicPlaying ? <VolumeUpIcon /> : <VolumeOffIcon />}
                    size="large" />
            </Box>
            <LoginDialog
                PaperProps={LoginDialogPaperProps}
                open={loginModalOpen}
                onClose={handleLoginDialogClose}
            />
        </Fragment>
    );

});
