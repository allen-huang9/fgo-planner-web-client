import { MasterAccount, MasterServant, MasterServantBondLevel } from '@fgo-planner/types';
import { Theme } from '@mui/material';
import { Box, SystemStyleObject, Theme as SystemTheme } from '@mui/system';
import clsx from 'clsx';
import lodash from 'lodash';
import React, { MouseEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RouteDataEditControls } from '../../../../components/control/route-data-edit-controls.component';
import { PromptDialog } from '../../../../components/dialog/prompt-dialog.component';
import { useGameServantMap } from '../../../../hooks/data/use-game-servant-map.hook';
import { useInjectable } from '../../../../hooks/dependency-injection/use-injectable.hook';
import { useActiveBreakpoints } from '../../../../hooks/user-interface/use-active-breakpoints.hook';
import { useLoadingIndicator } from '../../../../hooks/user-interface/use-loading-indicator.hook';
import { useForceUpdate } from '../../../../hooks/utils/use-force-update.hook';
import { MasterAccountService } from '../../../../services/data/master/master-account.service';
import { ThemeConstants } from '../../../../styles/theme-constants';
import { Immutable, MasterServantUpdate, ModalOnCloseReason, Nullable } from '../../../../types/internal';
import { Functions } from '../../../../utils/functions';
import { MasterServantUpdateUtils } from '../../../../utils/master/master-servant-update.utils';
import { MasterServantUtils } from '../../../../utils/master/master-servant.utils';
import { SetUtils } from '../../../../utils/set.utils';
import { SubscribablesContainer } from '../../../../utils/subscription/subscribables-container';
import { SubscriptionTopics } from '../../../../utils/subscription/subscription-topics';
import { MasterServantListVisibleColumns } from '../../components/master/servant/list/master-servant-list-columns';
import { MasterServantList, StyleClassPrefix as MasterServantListStyleClassPrefix } from '../../components/master/servant/list/master-servant-list.component';
import { MasterServantContextMenu } from './master-servants-context-menu.component';
import { MasterServantsEditDialog } from './master-servants-edit-dialog.component';
import { MasterServantsInfoPanel } from './master-servants-info-panel.component';
import { MasterServantsMultiAddDialog, MultiAddServantData } from './master-servants-multi-add-dialog.component';
import { MasterServantsNavigationRail } from './master-servants-navigation-rail.component';

type ServantSelection = {
    instanceIds: Set<number>;
    servants: Array<MasterServant>;
};

type MasterAccountData = {
    masterServants: Array<MasterServant>;
    bondLevels: Record<number, MasterServantBondLevel>;
    unlockedCostumes: Array<number>;
};

const getDefaultServantSelection = (): ServantSelection => ({
    instanceIds: new Set(),
    servants: []
});

const getDefaultMasterAccountData = (): MasterAccountData => ({
    masterServants: [],
    bondLevels: {},
    unlockedCostumes: []
});

const cloneMasterAccountData = (account: Nullable<Immutable<MasterAccount>>): MasterAccountData => {
    if (!account) {
        return getDefaultMasterAccountData();
    }
    return {
        masterServants: account.servants.map(MasterServantUtils.clone),
        bondLevels: lodash.cloneDeep(account.bondLevels),
        unlockedCostumes: [...account.costumes]
    };
};

const StyleClassPrefix = 'MasterServants';
 
const StyleProps = (theme: SystemTheme) => {

    const {
        breakpoints,
        palette
    } = theme as Theme;

    return {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        [`& .${StyleClassPrefix}-main-content`]: {
            display: 'flex',
            width: 'calc(100% - 56px)',
            [`& .${StyleClassPrefix}-list-container`]: {
                // background: palette.background.paper,
                flex: 1,
                overflow: 'hidden',
                [`& .${MasterServantListStyleClassPrefix}-root`]: {
                    background: palette.background.paper,
                    borderRightWidth: 1,
                    borderRightStyle: 'solid',
                    borderRightColor: palette.divider,
                    [`& .${MasterServantListStyleClassPrefix}-list-container`]: {
                        height: '100%'
                    }
                }
            },
            [`& .${StyleClassPrefix}-info-panel-container`]: {
                height: '100%',
                boxSizing: 'border-box',
                [breakpoints.down('md')]: {
                    display: 'none'
                }
            },
        },
        [`& .${StyleClassPrefix}-unsaved-message`]: {
            color: palette.warning.main
        }
    } as SystemStyleObject<SystemTheme>;
};

export const MasterServantsRoute = React.memo(() => {

    // useNavigationDrawerNoAnimations();

    const forceUpdate = useForceUpdate();

    const {
        invokeLoadingIndicator,
        resetLoadingIndicator,
        isLoadingIndicatorActive
    } = useLoadingIndicator();

    const masterAccountService = useInjectable(MasterAccountService);

    const gameServantMap = useGameServantMap();

    /**
     * The master account data loaded from the backend. This should not be modified
     * or used anywhere in this route, except when reverting changes. Use
     * `masterAccountDataRef` instead.
     */
    const [masterAccount, setMasterAccount] = useState<Nullable<Immutable<MasterAccount>>>();
    /**
     * Contains the `servants`, `bondLevels`, and `unlockedCostumes` data from the
     * `MasterAccount` object.
     *
     * The data is cloned to avoid unwanted modification of the original data. In
     * addition, the data is stored as a ref to prevent unwanted triggering of hooks
     * on change.
     */
    const masterAccountDataRef = useRef<MasterAccountData>(getDefaultMasterAccountData());
    /**
     * Whether the user has made any unsaved changes to the master servant data.
     */
    const [isMasterAccountDirty, setIsMasterAccountDirty] = useState<boolean>(false);

    /**
     * The anchor coordinates for the servant context menu.
     */
    const [servantContextMenuPosition, setServantContextMenuPosition] = useState<{ x: number, y: number }>();

    /**
     * Whether the info panel is open (expanded).
     */
    const [isInfoPanelOpen, setIsInfoPanelOpen] = useState<boolean>(true);

    /**
     * Whether the multi-add servant dialog is open.
     */
    const [isMultiAddServantDialogOpen, setIsMultiAddServantDialogOpen] = useState<boolean>(false);

    /**
     * Contains a copy of the target servants' data that is passed directly into and
     * modified by the dialog. The original data is not modified until the changes
     * are submitted.
     *
     * The `open` state of the servant edit dialog is also determined by whether
     * this data is present (dialog is opened if data is defined, and closed if data
     * is undefined).
     */
    const [editServantDialogData, setEditServantDialogData] = useState<MasterServantUpdate>();

    /**
     * Contains the message prompt that is displayed by the delete servant dialog.
     *
     * The `open` state of the delete servant dialog is also determined by whether
     * this data is present (dialog is opened if data is defined, and closed if data
     * is undefined).
     */
    const [deleteServantDialogData, setDeleteServantDialogData] = useState<ReactNode>();

    /**
     * Shallow clone of the `masterServants` array from `masterAccountDataRef` for
     * use with drag-drop mode.
     * 
     * This will be `undefined` when not in drag-drop mode.
     */
    const [dragDropMasterServants, setDragDropMasterServants] = useState<Array<MasterServant>>();

    const dragDropMode = !!dragDropMasterServants;

    // TODO No way to toggle this right now...
    const [showAppendSkills,] = useState<boolean>(true);

    const { sm, md } = useActiveBreakpoints();

    // TODO Make this user configurable...
    const visibleColumns = useMemo((): MasterServantListVisibleColumns => ({
        npLevel: sm,
        level: sm,
        bondLevel: sm,
        fouHp: sm,
        fouAtk: sm,
        skills: sm,
        appendSkills: sm && showAppendSkills,
        actions: false
    }), [showAppendSkills, sm]);

    /**
     * The selected servants.
     */
    const selectedServantsRef = useRef<ServantSelection>({
        instanceIds: new Set(),
        servants: []
    });

    /**
     * If the `masterServants` reference changes (due to data being reloaded, etc.)
     * the some of the currently selected instance IDs may no longer be present. In
     * addition, the servant object references themselves could have changed.
     *
     * This function validates and updates the `selectedServantsRef` data against
     * the updated `masterServants` data.
     */
    const updateSelectedServantsRef = useCallback((): void => {
        const currentSelectionIds = selectedServantsRef.current.instanceIds;
        if (!currentSelectionIds.size || !masterAccountDataRef.current) {
            return;
        }
        const updatedMasterServants = masterAccountDataRef.current.masterServants;
        const updatedSelection = updatedMasterServants.filter(servant => currentSelectionIds.has(servant.instanceId));
        const updatedSelectionIds = new Set(updatedSelection.map(servant => servant.instanceId));
        selectedServantsRef.current = {
            instanceIds: updatedSelectionIds,
            servants: updatedSelection
        };
    }, []);

    /*
     * Master account change subscription.
     */
    useEffect(() => {
        const onCurrentMasterAccountChangeSubscription = SubscribablesContainer
            .get(SubscriptionTopics.User.CurrentMasterAccountChange)
            .subscribe(account => {
                masterAccountDataRef.current = cloneMasterAccountData(account);
                const isSameAccount = masterAccount?._id === account?._id;
                if (isSameAccount) {
                    updateSelectedServantsRef();
                } else {
                    selectedServantsRef.current = getDefaultServantSelection();
                }
                setMasterAccount(account);
                setIsMasterAccountDirty(false);
            });

        return () => onCurrentMasterAccountChangeSubscription.unsubscribe();
    }, [masterAccount?._id, updateSelectedServantsRef]);


    //#region Internal helper functions

    /**
     * Sends master servant update request to the back-end.
     */
    const updateMasterAccount = useCallback(async (): Promise<void> => {
        if (!masterAccount) {
            return;
        }
        invokeLoadingIndicator();

        setEditServantDialogData(undefined);
        setDeleteServantDialogData(undefined);

        const {
            masterServants,
            bondLevels,
            unlockedCostumes
        } = masterAccountDataRef.current;

        const update: Partial<MasterAccount> = {
            _id: masterAccount._id,
            servants: masterServants,
            bondLevels,
            costumes: unlockedCostumes
        };
        try {
            await masterAccountService.updateAccount(update);
        } catch (error: any) {
            // TODO Display error message to user.
            console.error(error);
            masterAccountDataRef.current = cloneMasterAccountData(masterAccount);
            updateSelectedServantsRef();
            setIsMasterAccountDirty(false);
        }

        resetLoadingIndicator();

    }, [invokeLoadingIndicator, masterAccount, masterAccountService, resetLoadingIndicator, updateSelectedServantsRef]);

    const setServantSelection = useCallback((instanceIds: Array<number>): void => {
        /*
         * Servant selection is not allowed in drag-drop mode.
         */
        if (dragDropMode) {
            return;
        }
        const updatedSelectionIds = new Set(instanceIds);
        if (SetUtils.isEqual(updatedSelectionIds, selectedServantsRef.current.instanceIds)) {
            return;
        }
        const { masterServants } = masterAccountDataRef.current;
        selectedServantsRef.current = {
            instanceIds: updatedSelectionIds,
            servants: masterServants.filter(servant => updatedSelectionIds.has(servant.instanceId))
        };
        forceUpdate();
    }, [dragDropMode, forceUpdate]);

    const selectAllServants = useCallback((): void => {
        const { masterServants } = masterAccountDataRef.current;
        const instanceIds = masterServants.map(servant => servant.instanceId);
        setServantSelection(instanceIds);
    }, [setServantSelection]);

    const deselectAllServants = useCallback((): void => {
        setServantSelection([]);
    }, [setServantSelection]);

    const addNewServant = useCallback((update: MasterServantUpdate) => {

        const {
            masterServants,
            bondLevels,
            // unlockedCostumes
        } = masterAccountDataRef.current;

        /**
         * Computed instance ID for the new servant.
         */
        const instanceId = MasterServantUtils.getLastInstanceId(masterServants) + 1;
        /**
         * New instance of a `MasterServant` object. This will be populated with the
         * data returned by the dialog.
         */
        const masterServant = MasterServantUtils.instantiate(instanceId);
        MasterServantUpdateUtils.applyFromUpdatePayload(masterServant, update, bondLevels);
        /*
         * Rebuild the entire array with the new servant included to force the child
         * list to re-render.
         */
        masterAccountDataRef.current.masterServants = [...masterServants, masterServant];
        /*
         * TODO Also update the unlocked costumes.
         */
        setIsMasterAccountDirty(true);
    }, []);

    const addNewServants = useCallback((servantIds: Array<number>, summoned: boolean) => {

        const { masterServants } = masterAccountDataRef.current;

        /**
         * Computed instance ID for the new servants.
         */
        let instanceId = MasterServantUtils.getLastInstanceId(masterServants) + 1;
        /**
         * The new `MasterServant` objects to be added.
         */
        const newMasterServants = servantIds.map(servantId => {
            const newMasterServant = MasterServantUtils.instantiate(instanceId++);
            newMasterServant.gameId = servantId;
            newMasterServant.summoned = summoned;
            return newMasterServant;
        });
        /*
         * Rebuild the entire array with the new servant included to force the child
         * list to re-render.
         */
        masterAccountDataRef.current.masterServants = [...masterServants, ...newMasterServants];
        /*
         * TODO Also update the unlocked costumes.
         */
        setIsMasterAccountDirty(true);
    }, []);

    /**
     * Applies the submitted edit to the currently selected servants.
     */
    const applyUpdateToSelectedServants = useCallback((update: MasterServantUpdate) => {

        const {
            masterServants,
            bondLevels,
            // unlockedCostumes
        } = masterAccountDataRef.current;

        /*
         * Apply the change data for all of the selected servants.
         */
        const { servants: selectedServants } = selectedServantsRef.current;
        MasterServantUpdateUtils.applyFromUpdatePayload(selectedServants, update, bondLevels);
        /*
         * FIXME This n^2 operation might get slow as we have more servants.
         */
        for (const selectedServant of selectedServants) {
            /*
             * The master servants in the `selectedServantsRef` should have the same object
             * references as the ones in the `masterAccountDataRef`, so we can search
             * directly by reference.
             */
            const index = masterServants.indexOf(selectedServant);
            if (index !== -1) {
                /*
                 * Re-build the servant object to force its row to re-render.
                 */
                masterServants[index] = { ...selectedServant };
            }
        }
        /*
         * Rebuild the entire array to force the child list to re-render.
         */
        masterAccountDataRef.current.masterServants = [...masterServants];
        /*
         * TODO Also update the unlocked costumes.
         */
        updateSelectedServantsRef();
        setIsMasterAccountDirty(true);
    }, [updateSelectedServantsRef]);

    /**
     * Deletes the currently selected servants.
     */
    const deleteSelectedServants = useCallback((): void => {
        const { servants: selectedServants } = selectedServantsRef.current;
        if (!selectedServants.length) {
            return;
        }
        let { masterServants } = masterAccountDataRef.current;
        /*
         * The master servants in the `selectedServantsRef` should have the same object
         * references as the ones in the `masterAccountDataRef`, so we can search
         * directly by reference.
         * 
         * This will also rebuild the entire array to force the child list to re-render.
         * 
         * FIXME This n^2 operation might get slow as we have more servants.
         */
        masterServants = masterServants.filter(servant => !selectedServants.includes(servant));
        masterAccountDataRef.current.masterServants = masterServants;
        /*
         * TODO Also remove bond/costume data if the last instance of the servant is
         * removed.
         */
        selectedServantsRef.current = getDefaultServantSelection();
        setDeleteServantDialogData(undefined);
        setIsMasterAccountDirty(true);
    }, []);

    const openAddServantDialog = useCallback((): void => {
        const {
            bondLevels,
            unlockedCostumes
        } = masterAccountDataRef.current;

        const editServantDialogData = MasterServantUpdateUtils.instantiateForNewServant(bondLevels, unlockedCostumes);
        setEditServantDialogData(editServantDialogData);
        setIsMultiAddServantDialogOpen(false);
        setDeleteServantDialogData(undefined);
    }, []);

    const openMultiAddServantDialog = useCallback((): void => {
        setIsMultiAddServantDialogOpen(true);
        setEditServantDialogData(undefined);
        setDeleteServantDialogData(undefined);
    }, []);

    const openEditServantDialog = useCallback((): void => {
        const { servants: selectedServants } = selectedServantsRef.current;
        if (!selectedServants.length) {
            return;
        }

        const {
            bondLevels,
            unlockedCostumes
        } = masterAccountDataRef.current;

        const editServantDialogData = MasterServantUpdateUtils.convertToUpdatePayload(selectedServants, bondLevels, unlockedCostumes);
        setEditServantDialogData(editServantDialogData);
        setIsMultiAddServantDialogOpen(false);
        setDeleteServantDialogData(undefined);
    }, []);

    const openDeleteServantDialog = useCallback((): void => {
        if (!gameServantMap) {
            return;
        }
        const { servants: selectedServants } = selectedServantsRef.current;
        if (!selectedServants.length) {
            return;
        }
        // TODO Un-hardcode static strings.
        const prompt = <>
            <p>The following servant{selectedServants.length > 1 && 's'} will be deleted:</p>
            <ul>
                {selectedServants.map(({ gameId }) => {
                    const { name, metadata } = gameServantMap[gameId];
                    return <li>{metadata?.displayName || name || gameId}</li>;
                })}
            </ul>
            <p>Are you sure you want to proceed?</p>
        </>;
        setDeleteServantDialogData(prompt);
        setIsMultiAddServantDialogOpen(false);
        setEditServantDialogData(undefined);
    }, [gameServantMap]);


    //#endregion


    //#region Navigation rail event handlers

    const handleMultiAddServant = openMultiAddServantDialog;

    const handleDragDropActivate = useCallback(() => {
        /*
         * Deselect servants...servant selection is not allowed in drag-drop mode.
         */
        selectedServantsRef.current = getDefaultServantSelection();
        setDragDropMasterServants([...masterAccountDataRef.current.masterServants]);
    }, []);

    const handleDragDropApply = useCallback(() => {
        if (!dragDropMasterServants) {
            return;
        }
        masterAccountDataRef.current.masterServants = dragDropMasterServants;
        setDragDropMasterServants(undefined);
        // TODO Check if order actually changed before setting dirty.
        setIsMasterAccountDirty(true);
    }, [dragDropMasterServants]);

    const handleDragDropCancel = useCallback(() => {
        setDragDropMasterServants(undefined);
    }, []);

    //#endregion


    //#region Servant list event handlers

    const handleEditServant = useCallback(({ instanceId }: MasterServant): void => {
        if (dragDropMode) {
            return;
        }
        /*
         * Select the target servant. This is needed because the servant edit dialog
         * will target whichever servant are currently selected on submit.
         */
        setServantSelection([instanceId]);
        openEditServantDialog();
    }, [dragDropMode, openEditServantDialog, setServantSelection]);

    const handleDeleteServant = useCallback(({ instanceId }: MasterServant): void => {
        if (dragDropMode) {
            return;
        }
        /*
         * Select the target servant. This is needed because the delete servant dialog
         * will target whichever servant are currently selected on submit.
         */
        setServantSelection([instanceId]);
        openDeleteServantDialog();
    }, [dragDropMode, openDeleteServantDialog, setServantSelection]);

    const handleServantContextMenuOpen = useCallback((e: MouseEvent<HTMLDivElement>): void => {
        const { pageX: x, pageY: y } = e;
        setServantContextMenuPosition({ x, y });
    }, []);

    const handleServantContextMenuClose = useCallback((): void => {
        setServantContextMenuPosition(undefined);
    }, []);

    //#endregion
    
    
    //#region Context menu event handlers
    
    const handleSelectAllServants = useCallback(() => {
        selectAllServants();
    }, [selectAllServants]);

    const handleDeselectAllServants = useCallback(() => {
        deselectAllServants();
    }, [deselectAllServants]);
    
    //#endregion


    //#region Common event handlers

    const handleToggleInfoPanelOpen = useCallback(() => {
        setIsInfoPanelOpen(Functions.toggleTruthy);
    }, []);

    //#endregion


    //#region Common event handlers

    const handleAddServant = openAddServantDialog;

    const handleEditSelectedServants = openEditServantDialog;

    const handleDeleteSelectedServants = openDeleteServantDialog;

    //#endregion


    //#region Other event handlers

    const handleFormChange = useCallback((): void => {
        const masterAccountData = masterAccountDataRef.current;
        masterAccountData.masterServants = [...masterAccountData.masterServants]; // Forces child list to re-render
        forceUpdate();
    }, [forceUpdate]);

    const handleSaveButtonClick = useCallback((): void => {
        updateMasterAccount();
    }, [updateMasterAccount]);

    const handleRevertButtonClick = useCallback((): void => {
        // Copy data back from master account
        masterAccountDataRef.current = cloneMasterAccountData(masterAccount);
        updateSelectedServantsRef();
        setIsMasterAccountDirty(false);
    }, [masterAccount, updateSelectedServantsRef]);

    const handleMultiAddServantDialogClose = useCallback((event: any, reason: any, data?: MultiAddServantData): void => {
        if (data) {
            addNewServants(data.gameIds, data.summoned);
        }
        setIsMultiAddServantDialogOpen(false);
    }, [addNewServants]);

    const handleEditServantDialogClose = useCallback((event: any, reason: any, data?: MasterServantUpdate): void => {
        setEditServantDialogData(undefined);
        /*
         * Close the dialog without taking any further action if the changes were
         * cancelled (if `data` is undefined, then the changes were cancelled).
         */
        if (!data) {
            return;
        }
        if (data.isNewServant) {
            addNewServant(data);
        } else {
            applyUpdateToSelectedServants(data);
        }
    }, [addNewServant, applyUpdateToSelectedServants]);

    const handleDeleteServantDialogClose = useCallback((event: MouseEvent, reason: ModalOnCloseReason): any => {
        if (reason !== 'submit') {
            return setDeleteServantDialogData(undefined);
        }
        deleteSelectedServants();
    }, [deleteSelectedServants]);

    //#endregion


    //#region Component rendering

    /*
     * This can be undefined during the initial render.
     */
    if (!gameServantMap) {
        return null;
    }

    const {
        instanceIds: selectedInstanceIds,
        servants: selectedServants
    } = selectedServantsRef.current;

    const isMultipleServantsSelected = selectedServants.length > 1;

    const {
        masterServants,
        bondLevels,
        unlockedCostumes
    } = masterAccountDataRef.current;

    return (
        <Box className={`${StyleClassPrefix}-root`} sx={StyleProps}>
            <RouteDataEditControls
                title='Servant Roster'
                hasUnsavedData={isMasterAccountDirty}
                onRevertButtonClick={handleRevertButtonClick}
                onSaveButtonClick={handleSaveButtonClick}
                disabled={isLoadingIndicatorActive}
            />
            <div className='flex overflow-hidden full-height'>
                <MasterServantsNavigationRail
                    selectedServantsCount={selectedServants.length}
                    dragDropMode={dragDropMode}
                    onAddServant={handleAddServant}
                    onMultiAddServant={handleMultiAddServant}
                    onDeleteSelectedServants={handleDeleteSelectedServants}
                    onDragDropActivate={handleDragDropActivate}
                    onDragDropApply={handleDragDropApply}
                    onDragDropCancel={handleDragDropCancel}
                    onEditSelectedServants={handleEditSelectedServants}
                />
                <div className={`${StyleClassPrefix}-main-content`}>
                    <div className={clsx(`${StyleClassPrefix}-list-container`, ThemeConstants.ClassScrollbarTrackBorder)}>
                        <MasterServantList
                            masterServants={dragDropMasterServants || masterServants}
                            bondLevels={bondLevels}
                            selectedServants={selectedInstanceIds}
                            // showAddServantRow
                            visibleColumns={visibleColumns}
                            dragDropMode={dragDropMode}
                            onServantSelectionChange={setServantSelection}
                            onServantContextMenu={handleServantContextMenuOpen}
                            onEditSelectedServants={handleEditSelectedServants}
                            onEditServant={handleEditServant}
                            onDeleteServant={handleDeleteServant}
                        />
                    </div>
                    <div className={`${StyleClassPrefix}-info-panel-container`}>
                        <MasterServantsInfoPanel
                            keepChildrenMounted  // TODO Change this to false for mobile view, also make it user configurable.
                            activeServants={selectedServants}
                            bondLevels={bondLevels}
                            unlockedCostumes={unlockedCostumes}
                            // editMode={editMode}
                            onStatsChange={handleFormChange}  // This currently doesn't do anything
                            open={isInfoPanelOpen && md}
                            onOpenToggle={handleToggleInfoPanelOpen}
                        />
                    </div>
                </div>
            </div>
            <MasterServantsEditDialog
                bondLevels={bondLevels}
                masterServantUpdate={editServantDialogData}
                isMultipleServantsSelected={isMultipleServantsSelected}
                showAppendSkills={showAppendSkills}
                onClose={handleEditServantDialogClose}
            />
            <MasterServantsMultiAddDialog
                open={isMultiAddServantDialogOpen}
                masterServants={masterServants}
                onClose={handleMultiAddServantDialogClose}
            />
            <PromptDialog
                open={!!deleteServantDialogData}
                title={`Delete ${isMultipleServantsSelected ? 'Servants' : 'Servant'}?`}
                prompt={deleteServantDialogData}
                cancelButtonColor='secondary'
                confirmButtonColor='primary'
                confirmButtonLabel='Delete'
                onClose={handleDeleteServantDialogClose}
            />
            <MasterServantContextMenu
                position={servantContextMenuPosition}
                selectedServantsCount={selectedServants.length}
                onAddServant={handleAddServant}
                onDeleteSelectedServants={handleDeleteSelectedServants}
                onEditSelectedServants={handleEditSelectedServants}
                onSelectAllServants={handleSelectAllServants}
                onDeselectAllServants={handleDeselectAllServants}
                onClose={handleServantContextMenuClose}
            />
        </Box>
    );

    //#endregion

});
