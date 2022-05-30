import { Menu as MenuIcon } from '@mui/icons-material';
import { IconButton, Paper } from '@mui/material';
import { SystemStyleObject, Theme } from '@mui/system';
import clsx from 'clsx';
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInjectable } from '../../../hooks/dependency-injection/use-injectable.hook';
import { BasicUser, UserService } from '../../../services/data/user/user.service';
import { UserInterfaceService } from '../../../services/user-interface/user-interface.service';
import { ThemeConstants } from '../../../styles/theme-constants';
import { SubscribablesContainer } from '../../../utils/subscription/subscribables-container';
import { SubscriptionTopics } from '../../../utils/subscription/subscription-topics';
import { AppBarAuthenticatedUser } from './authenticated/app-bar-authenticated-user.component';
import { AppBarGuestUser } from './guest/app-bar-guest-user.component';

const StyleClassPrefix = 'AppBar';

const StyleProps = (theme: Theme) => ({
    height: theme.spacing(ThemeConstants.AppBarHeightScale),
    bgcolor: 'background.default',
    transition: 'box-shadow 200ms 50ms linear',
    backgroundImage: 'none',
    '&.no-elevation': {
        // Simulates 1px solid border
        boxShadow: `0px 1px 0px ${theme.palette.divider}`
        // boxShadow: 'none'
    },
    [`& .${StyleClassPrefix}-background-image`]: {
        height: theme.spacing(ThemeConstants.AppBarHeightScale),
    },
    [`& .${StyleClassPrefix}-contents`]: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        pl: 3,
        [`& .${StyleClassPrefix}-title`]: {
            fontFamily: ThemeConstants.FontFamilyGoogleSans,
            fontSize: '24px',
            color: 'text.primary',
            textDecoration: 'none',
            pl: 4,
            mr: 6,
            [theme.breakpoints.down('lg')]: {
                display: 'none'
            }
        }
    }
} as SystemStyleObject<Theme>);

/**
 * The app bar component.
 */
export const AppBar = React.memo(() => {

    const userInterfaceService = useInjectable(UserInterfaceService);
    const userService = useInjectable(UserService);

    const [currentUser, setCurrentUser] = useState<BasicUser>();
    const [elevated, setElevated] = useState<boolean>(false);

    /*
     * Current user change subscription.
     */
    useEffect(() => {
        const onCurrentUserChangeSubscription = SubscribablesContainer
            .get(SubscriptionTopics.User.CurrentUserChange)
            .subscribe(async (userInfo) => {
                if (userInfo) {
                    // TODO Handle error
                    const currentUser = await userService.getCurrentUser();
                    setCurrentUser(currentUser);
                } else {
                    setCurrentUser(undefined);
                }
            });

        return () => onCurrentUserChangeSubscription.unsubscribe();
    }, [userService]);

    /*
     * App bar elevation change subscription.
     */
    useEffect(() => {
        const onElevatedChangeSubscription = SubscribablesContainer
            .get(SubscriptionTopics.UserInterface.AppBarElevatedChange)
            .subscribe(setElevated);

        return () => onElevatedChangeSubscription.unsubscribe();
    }, []);

    const handleNavigationDrawerButtonClick = useCallback((): void => {
        userInterfaceService.toggleNavigationDrawerOpen();
    }, [userInterfaceService]);

    return (
        // TODO Probably could just use regular div/Box for this, and use theme.shadow[x] to get shadow styling.
        <Paper
            className={clsx(`${StyleClassPrefix}-root`, !elevated && 'no-elevation')}
            sx={StyleProps}
            elevation={ThemeConstants.AppBarElevatedElevation}
            square={true}
        >
            {/* <ThemeBackground className={`${StyleClassPrefix}-background-image`} /> */}
            <div className={`${StyleClassPrefix}-contents`}>
                {/* TODO Hide menu button in desktop view */}
                <IconButton onClick={handleNavigationDrawerButtonClick}>
                    <MenuIcon />
                </IconButton>
                {/* TODO Add logo */}
                <Link className={`${StyleClassPrefix}-title`} to='/'>
                    FGO Servant Planner
                </Link>
                {currentUser ?
                    <AppBarAuthenticatedUser currentUser={currentUser} /> :
                    <AppBarGuestUser />
                }
            </div>
        </Paper>
    );

});
