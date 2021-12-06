import { MasterAccount } from '@fgo-planner/types';
import { Fab, IconButton, Tooltip } from '@mui/material';
import { Clear as ClearIcon, Edit as EditIcon, FormatListBulleted as FormatListBulletedIcon, Save as SaveIcon } from '@mui/icons-material';
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FabContainer } from '../../../../components/fab/fab-container.component';
import { LayoutPanelScrollable } from '../../../../components/layout/layout-panel-scrollable.component';
import { NavigationRail } from '../../../../components/navigation/navigation-rail.component';
import { PageTitle } from '../../../../components/text/page-title.component';
import { useForceUpdate } from '../../../../hooks/utils/use-force-update.hook';
import { MasterAccountService } from '../../../../services/data/master/master-account.service';
import { LoadingIndicatorOverlayService } from '../../../../services/user-interface/loading-indicator-overlay.service';
import { Nullable } from '../../../../types/internal';
import { MasterServantCostumesListHeader } from './master-servant-costumes-list-header.component';
import { MasterServantCostumesList } from './master-servant-costumes-list.component';

const getUnlockedCostumeSetFromMasterAccount = (account: Nullable<MasterAccount>): Set<number> => {
    if (!account) {
        return new Set();
    }
    return new Set(account.costumes);
};

export const MasterServantCostumesRoute = React.memo(() => {

    const forceUpdate = useForceUpdate();

    const [masterAccount, setMasterAccount] = useState<Nullable<MasterAccount>>();
    const [unlockedCostumesSet, setUnlockedCostumesSet] = useState<Set<number>>(new Set());
    const [editMode, setEditMode] = useState<boolean>(false);

    const loadingIndicatorIdRef = useRef<string>();

    const resetLoadingIndicator = useCallback((): void => {
        const loadingIndicatorId = loadingIndicatorIdRef.current;
        if (loadingIndicatorId) {
            LoadingIndicatorOverlayService.waive(loadingIndicatorId);
            loadingIndicatorIdRef.current = undefined;
            forceUpdate();
        }
    }, [forceUpdate]);

    /**
     * onCurrentMasterAccountChange subscriptions
     */
    useEffect(() => {
        const onCurrentMasterAccountChangeSubscription = MasterAccountService.onCurrentMasterAccountChange
            .subscribe(account => {
                const unlockedCostumesSet = getUnlockedCostumeSetFromMasterAccount(account);
                setMasterAccount(account);
                setUnlockedCostumesSet(unlockedCostumesSet);
                setEditMode(false);
            });

        return () => onCurrentMasterAccountChangeSubscription.unsubscribe();
    }, []);

    /**
     * onCurrentMasterAccountUpdated subscriptions
     */
    useEffect(() => {
        const onCurrentMasterAccountUpdatedSubscription = MasterAccountService.onCurrentMasterAccountUpdated
            .subscribe(account => {
                if (account == null) {
                    return;
                }
                const unlockedCostumesSet = getUnlockedCostumeSetFromMasterAccount(account);
                resetLoadingIndicator();
                setMasterAccount(account);
                setUnlockedCostumesSet(unlockedCostumesSet);
                setEditMode(false);
            });

        return () => onCurrentMasterAccountUpdatedSubscription.unsubscribe();
    }, [resetLoadingIndicator]);

    const handleUpdateError = useCallback((error: any): void => {
        // TODO Display error message to user.
        console.error(error);
        const unlockedCostumesSet = getUnlockedCostumeSetFromMasterAccount(masterAccount);
        resetLoadingIndicator();
        setUnlockedCostumesSet(unlockedCostumesSet);
        setEditMode(false);
    }, [masterAccount, resetLoadingIndicator]);

    const handleEditButtonClick = useCallback((): void => {
        setEditMode(true);
    }, []);

    const handleSaveButtonClick = useCallback((): void => {
        const masterAccountId = masterAccount?._id;
        if (!masterAccountId) {
            return;
        }

        const update = {
            _id: masterAccountId,
            costumes: [...unlockedCostumesSet]
        };
        MasterAccountService.updateAccount(update)
            .catch(handleUpdateError);

        let loadingIndicatorId = loadingIndicatorIdRef.current;
        if (!loadingIndicatorId) {
            loadingIndicatorId = LoadingIndicatorOverlayService.invoke();
        }
        loadingIndicatorIdRef.current = loadingIndicatorId;

    }, [unlockedCostumesSet, masterAccount?._id, handleUpdateError]);

    const handleCancelButtonClick = useCallback((): void => {
        // Re-clone data from master account
        const unlockedCostumesSet = getUnlockedCostumeSetFromMasterAccount(masterAccount);
        setUnlockedCostumesSet(unlockedCostumesSet);
        setEditMode(false);
    }, [masterAccount]);

    /**
     * NavigationRail children
     */
    const navigationRailChildNodes: ReactNode = useMemo(() => {
        return (
            <Tooltip key="servants" title="Back to servant list" placement="right">
                <div>
                    <IconButton
                        component={Link}
                        to="../master/servants"
                        children={<FormatListBulletedIcon />}
                        size="large" />
                </div>
            </Tooltip>
        );
    }, []);

    /**
     * FabContainer children
     */
    const fabContainerChildNodes: ReactNode = useMemo(() => {
        if (!editMode) {
            return (
                <Tooltip key="edit" title="Edit">
                    <div>
                        <Fab
                            color="primary"
                            onClick={handleEditButtonClick}
                            disabled={!!loadingIndicatorIdRef.current}
                            children={<EditIcon />}
                        />
                    </div>
                </Tooltip>
            );
        }
        return [
            <Tooltip key="cancel" title="Cancel">
                <div>
                    <Fab
                        color="default"
                        onClick={handleCancelButtonClick}
                        disabled={!!loadingIndicatorIdRef.current}
                        children={<ClearIcon />}
                    />
                </div>
            </Tooltip>,
            <Tooltip key="save" title="Save">
                <div>
                    <Fab
                        color="primary"
                        onClick={handleSaveButtonClick}
                        disabled={!!loadingIndicatorIdRef.current}
                        children={<SaveIcon />}
                    />
                </div>
            </Tooltip>
        ];
    }, [editMode, handleCancelButtonClick, handleEditButtonClick, handleSaveButtonClick]);

    return (
        <div className="flex column full-height">
            <PageTitle>
                {editMode ?
                    'Edit Unlocked Costumes' :
                    'Unlocked Costumes'
                }
            </PageTitle>
            <div className="flex overflow-hidden">
                <NavigationRail children={navigationRailChildNodes} />
                <div className="flex flex-fill" style={{maxWidth: 'calc(100% - 56px)'}}>
                    <LayoutPanelScrollable 
                        className="py-4 pr-4 full-height flex-fill scrollbar-track-border"
                        headerContents={
                            <MasterServantCostumesListHeader />
                        }
                        children={
                            <MasterServantCostumesList
                                unlockedCostumesSet={unlockedCostumesSet}
                                editMode={editMode}
                            />
                        }
                    />
                </div>
            </div>
            <FabContainer children={fabContainerChildNodes} />
        </div>
    );

});