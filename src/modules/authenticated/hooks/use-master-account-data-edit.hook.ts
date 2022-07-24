import { MasterAccount, MasterServant, MasterServantBondLevel } from '@fgo-planner/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GameItemConstants } from '../../../constants';
import { useInjectable } from '../../../hooks/dependency-injection/use-injectable.hook';
import { useLoadingIndicator } from '../../../hooks/user-interface/use-loading-indicator.hook';
import { useForceUpdate } from '../../../hooks/utils/use-force-update.hook';
import { MasterAccountService } from '../../../services/data/master/master-account.service';
import { ExistingMasterServantUpdate, Immutable, ImmutableArray, NewMasterServantUpdate, Nullable, ReadonlyRecord } from '../../../types/internal';
import { ArrayUtils } from '../../../utils/array.utils';
import { MasterServantUpdateUtils } from '../../../utils/master/master-servant-update.utils';
import { MasterServantUtils } from '../../../utils/master/master-servant.utils';
import { SubscribablesContainer } from '../../../utils/subscription/subscribables-container';
import { SubscriptionTopics } from '../../../utils/subscription/subscription-topics';


//#region Type definitions

type MasterAccountDataEditHookIncludeOptions = {
    includeCostumes?: boolean;
    includeItems?: boolean;
    includeServants?: boolean;
    includeSoundtracks?: boolean;
};

export type MasterAccountDataEditHookOptions = {
    showAlertOnDirtyUnmount?: boolean;
} & MasterAccountDataEditHookIncludeOptions;

type MasterAccountEditData = {
    bondLevels: ReadonlyRecord<number, MasterServantBondLevel>;
    costumes: ReadonlySet<number>;
    items: ReadonlyRecord<number, number>;
    qp: number;
    /**
     * Any edits to a servant (including bond levels and unlocked costumes) will
     * result in a new array to be instantiated for this field. In addition, the
     * servants that were edited (tracked by `instanceId`) will also be
     * reconstructed.
     */
    servants: ImmutableArray<MasterServant>;
    soundtracks: ReadonlySet<number>;
};

type IdNumbers = ReadonlyArray<number> | ReadonlySet<number>;

type MasterAccountUpdateFunctions = {
    updateCostumes: (costumeIds: IdNumbers) => void;
    updateItem: (itemId: number, quantity: number) => void;
    updateQp: (amount: number) => void;
    /**
     * Add a single servant using the given `NewMasterServantUpdate` object.
     * 
     * Calls the `addServants` function internally. 
     */
    addServant: (servantData: NewMasterServantUpdate) => void;
    /**
     * Batch add servants. Each added servant will be instantiated using the given
     * `NewMasterServantUpdate` object.
     */
    addServants: (servantIds: IdNumbers, servantData: NewMasterServantUpdate) => void;
    /**
     * Updates the servants with the corresponding `instanceIds` using the given
     * `ExistingMasterServantUpdate` object.
     */
    updateServants: (instanceIds: IdNumbers, update: ExistingMasterServantUpdate) => void;
    /**
     * Updates the servant ordering based on an array of `instanceId` values.
     * Assumes that the array contains a corresponding `instanceId` value for each
     * servant. Missing `instanceId` values will result in the corresponding servant
     * being removed.
     */
    updateServantOrder: (instanceIds: ReadonlyArray<number>) => void;
    /**
     * Deletes the servants with the corresponding `instanceIds`.
     */
    deleteServants: (instanceIds: IdNumbers) => void;
    updateSoundtracks: (soundtrackIds: IdNumbers) => void;
    revertChanges: () => void;
    persistChanges: () => Promise<void>;
};

/* eslint-disable max-len */

type MasterAccountDataEditHookCommon = {
    isDataDirty: boolean;
};

type MasterAccountDataEditHookData = MasterAccountDataEditHookCommon & {
    masterAccountEditData: MasterAccountEditData;
} & MasterAccountUpdateFunctions;

type MasterAccountDataEditHookDataCostumesSubset = MasterAccountDataEditHookCommon & {
    masterAccountEditData: Pick<MasterAccountEditData, 'costumes'>;
} & Pick<MasterAccountUpdateFunctions, 'updateCostumes' | 'revertChanges' | 'persistChanges'>;

type MasterAccountDataEditHookDataItemsSubset = MasterAccountDataEditHookCommon & {
    masterAccountEditData: Pick<MasterAccountEditData, 'items' | 'qp'>;
} & Pick<MasterAccountUpdateFunctions, 'updateItem' | 'updateQp' | 'revertChanges' | 'persistChanges'>;

type MasterAccountDataEditHookDataServantsSubset = MasterAccountDataEditHookCommon & {
    masterAccountEditData: Pick<MasterAccountEditData, 'bondLevels' | 'servants'>;
} & Pick<MasterAccountUpdateFunctions, 'addServant' | 'addServants' | 'updateServants' | 'updateServantOrder' | 'deleteServants' | 'revertChanges' | 'persistChanges'>;

type MasterAccountDataEditHookDataSoundtracksSubset = MasterAccountDataEditHookCommon & {
    masterAccountEditData: Pick<MasterAccountEditData, 'soundtracks'>;
} & Pick<MasterAccountUpdateFunctions, 'updateSoundtracks' | 'revertChanges' | 'persistChanges'>;

/* eslint-enable max-len */

//#endregion


//#region Internal helper/utility functions

const toSet = (idNumbers: IdNumbers): ReadonlySet<number> => {
    if (idNumbers instanceof Set) {
        return idNumbers;
    }
    return new Set(idNumbers);
};

const getDefaultMasterAccountEditData = (): MasterAccountEditData => ({
    bondLevels: {},
    costumes: new Set<number>(),
    items: {},
    qp: 0,
    servants: [],
    soundtracks: new Set<number>()
});

const cloneMasterAccountDataForEdit = (
    masterAccount: Nullable<Immutable<MasterAccount>>,
    options: MasterAccountDataEditHookIncludeOptions
): MasterAccountEditData => {
    const result = getDefaultMasterAccountEditData();
    if (!masterAccount) {
        return result;
    }
    if (options.includeCostumes) {
        result.costumes = new Set(masterAccount.costumes);
    }
    if (options.includeItems) {
        const items = masterAccount.resources.items;
        result.items = ArrayUtils.mapArrayToObject(items, item => item.itemId, item => item.quantity);
        result.qp = masterAccount.resources.qp;
    }
    if (options.includeServants) {
        result.bondLevels = { ...masterAccount.bondLevels };
        result.servants = masterAccount.servants.map(MasterServantUtils.clone);
    }
    if (options.includeSoundtracks) {
        result.soundtracks = new Set(masterAccount.soundtracks);
    }
    return result;
};

//#endregion


//#region Hook function

/**
 * For costumes route.
 */
export function useMasterAccountDataEditHook(
    options: MasterAccountDataEditHookOptions & {
        includeCostumes: true;
        includeItems?: false;
        includeServants?: false;
        includeSoundtracks?: false;
    }
): MasterAccountDataEditHookDataCostumesSubset;
/**
 * For items route.
 */
export function useMasterAccountDataEditHook(
    options: MasterAccountDataEditHookOptions & {
        includeCostumes?: false;
        includeItems: true;
        includeServants?: false;
        includeSoundtracks?: false;
    }
): MasterAccountDataEditHookDataItemsSubset;
/**
 * For servants route.
 */
export function useMasterAccountDataEditHook(
    options: MasterAccountDataEditHookOptions & {
        includeCostumes: true;
        includeItems?: false;
        includeServants: true;
        includeSoundtracks?: false;
    }
): MasterAccountDataEditHookDataCostumesSubset & MasterAccountDataEditHookDataServantsSubset;
/**
 * For soundtracks route.
 */
export function useMasterAccountDataEditHook(
    options: MasterAccountDataEditHookOptions & {
        includeCostumes?: false;
        includeItems?: false;
        includeServants?: false;
        includeSoundtracks: true;
    }
): MasterAccountDataEditHookDataSoundtracksSubset;
/**
 *
 */
export function useMasterAccountDataEditHook(
    options?: MasterAccountDataEditHookOptions
): MasterAccountDataEditHookData;

export function useMasterAccountDataEditHook(
    {
        showAlertOnDirtyUnmount,
        includeCostumes,
        includeItems,
        includeServants,
        includeSoundtracks
    }: MasterAccountDataEditHookOptions = {}
): MasterAccountDataEditHookData {

    const forceUpdate = useForceUpdate();

    const { invokeLoadingIndicator, resetLoadingIndicator } = useLoadingIndicator();

    const masterAccountService = useInjectable(MasterAccountService);

    /**
     * The original master account data.
     */
    const [masterAccount, setMasterAccount] = useState<Nullable<Immutable<MasterAccount>>>();

    /**
     * The transformed copy of the master account data for editing.
     */
    const [editData, setEditData] = useState<MasterAccountEditData>(getDefaultMasterAccountEditData);

    /**
     * Whether the edit data has been modified.
     * 
     * TODO Track changes properly
     */
    const [isDataDirty, setIsDataDirty] = useState<boolean>(false);

    /**
     * Reconstruct the include options in a new object using `useMemo` so that it
     * doesn't inadvertently trigger recomputation of hooks even if the options
     * haven't changed.
     */
    const includeOptions = useMemo((): MasterAccountDataEditHookIncludeOptions => ({
        includeCostumes,
        includeItems,
        includeServants,
        includeSoundtracks
    }), [includeCostumes, includeItems, includeServants, includeSoundtracks]);

    /*
     * Master account change subscription.
     */
    useEffect(() => {
        const onCurrentMasterAccountChangeSubscription = SubscribablesContainer
            .get(SubscriptionTopics.User.CurrentMasterAccountChange)
            .subscribe(masterAccount => {
                const editData = cloneMasterAccountDataForEdit(masterAccount, includeOptions);
                setEditData(editData);
                setMasterAccount(masterAccount);
                setIsDataDirty(false);
            });

        return () => onCurrentMasterAccountChangeSubscription.unsubscribe();
    }, [includeOptions]);


    //#region Local create, update, delete functions

    const updateCostumes = useCallback((costumeIds: IdNumbers): void => {
        if (!includeCostumes) {
            return;
        }
        editData.costumes = new Set(costumeIds);
        setIsDataDirty(true); // TODO Track changes properly
        forceUpdate();
    }, [editData, forceUpdate, includeCostumes]);

    const updateQp = useCallback((amount: number): void => {
        if (!includeItems) {
            return;
        }
        if (editData.qp === amount) {
            return;
        }
        editData.qp = amount;
        setIsDataDirty(true); // TODO Track changes properly
        forceUpdate();
    }, [editData, forceUpdate, includeItems]);

    const updateItem = useCallback((itemId: number, quantity: number): void => {
        if (!includeItems) {
            return;
        }
        if (itemId === GameItemConstants.QpItemId) {
            updateQp(quantity);
        } else {
            let currentQuantity = editData.items[itemId];
            /*
             * If the user data doesn't have an entry for the item yet, then it will be
             * added with an initial value of zero.
             *
             * Note that this is only added to the edit data; the user will still have to
             * save the changes to persist the new entry.
             *
             * Also note that if the quantity is being updated to zero, the it will not be
             * considered a change, and the data will not be marked as dirty from the
             * update.
             */
            if (currentQuantity === undefined) {
                editData.items = {
                    ...editData.items,
                    [itemId]: currentQuantity = 0
                };
            }
            if (currentQuantity === quantity) {
                return;
            }
            editData.items = {
                ...editData.items,
                [itemId]: quantity
            };
            setIsDataDirty(true); // TODO Track changes properly
            forceUpdate();
        }
    }, [editData, forceUpdate, includeItems, updateQp]);

    const addServants = useCallback((servantIds: IdNumbers, servantData: NewMasterServantUpdate): void => {
        if (!includeServants) {
            return;
        }
        const {
            servants,
            bondLevels,
            // unlockedCostumes
        } = editData;

        /**
         * Computed instance ID for the new servant.
         */
        let instanceId = MasterServantUtils.getLastInstanceId(servants) + 1;

        /**
         * Updated servants array. A new array is constructed for this to conform with
         * the hook specifications.
         */
        const updatedServants = [...servants];

        /**
         * Construct new instance of a `MasterServant` object for each `servantId` and
         * add to the updated servants array.
         */
        for (const servantId of servantIds) {
            const newServant = MasterServantUtils.instantiate(instanceId++);
            MasterServantUpdateUtils.applyFromUpdateObject(newServant, servantData, bondLevels);
            newServant.gameId = servantId;

            updatedServants.push(newServant);
        };

        editData.servants = updatedServants;
        // TODO Also update the unlocked costumes.
        setIsDataDirty(true); // TODO Track changes properly
        forceUpdate();
    }, [editData, forceUpdate, includeServants]);

    const addServant = useCallback((servantData: NewMasterServantUpdate): void => {
        addServants([servantData.gameId], servantData);
    }, [addServants]);

    const updateServants = useCallback((instanceIds: IdNumbers, update: ExistingMasterServantUpdate): void => {
        if (!includeServants) {
            return;
        }
        const {
            servants,
            bondLevels,
            // unlockedCostumes
        } = editData;

        const instanceIdSet = toSet(instanceIds);

        /**
         * Updated servants array. A new array is constructed for this to conform with
         * the hook specifications.
         */
        const updatedServants = [];

        for (const servant of servants) {
            /*
             * If the servant is not an update target, then just add it to the new array and
             * continue.
             */
            if (!instanceIdSet.has(servant.instanceId)) {
                updatedServants.push(servant);
                continue;
            }
            /*
             * Apply the edit to the target servant. The target servant object is
             * re-constructed to conform with the hook specifications.
             */
            const targetServant = MasterServantUtils.clone(servant);
            MasterServantUpdateUtils.applyFromUpdateObject(targetServant, update, bondLevels);
            
            updatedServants.push(targetServant);
        }

        editData.servants = updatedServants;
        // TODO Also update the unlocked costumes.
        setIsDataDirty(true); // TODO Track changes properly
        forceUpdate();
    }, [editData, forceUpdate, includeServants]);

    const updateServantOrder = useCallback((instanceIds: ReadonlyArray<number>): void => {
        if (!includeServants) {
            return;
        }
        const { servants } = editData;

        /**
         * Updated servants array. A new array is constructed for this to conform with
         * the hook specifications.
         */
        const updatedServants = [];

        /**
         * TODO This is an n^2 operation, may need some optimizations if servant list
         * gets too big.
         */
        for (const instanceId of instanceIds) {
            const index = servants.findIndex(servant => servant.instanceId === instanceId);
            if (index !== -1) {
                updatedServants.push(servants[index]);
            }
        }

        editData.servants = updatedServants;
        setIsDataDirty(true); // TODO Track changes properly
        forceUpdate();
    }, [editData, forceUpdate, includeServants]);

    const deleteServants = useCallback((instanceIds: IdNumbers): void => {
        if (!includeServants) {
            return;
        }
        const { servants } = editData;

        const instanceIdSet = toSet(instanceIds);

        /**
         * Updated servants array. A new array is constructed for this to conform with
         * the hook specifications.
         */
        const updatedServants = servants.filter(({ instanceId }) => !instanceIdSet.has(instanceId));

        editData.servants = updatedServants;
        // TODO Also remove bond/costume data if the last instance of the servant is removed.
        setIsDataDirty(true); // TODO Track changes properly
        forceUpdate();
    }, [editData, forceUpdate, includeServants]);

    const updateSoundtracks = useCallback((soundtrackIds: IdNumbers): void => {
        if (!includeSoundtracks) {
            return;
        }
        editData.soundtracks = new Set(soundtrackIds);
        setIsDataDirty(true); // TODO Track changes properly
        forceUpdate();
    }, [editData, forceUpdate, includeSoundtracks]);

    const revertChanges = useCallback((): void => {
        const editData = cloneMasterAccountDataForEdit(masterAccount, includeOptions);
        setEditData(editData);
        setIsDataDirty(false);
    }, [includeOptions, masterAccount]);

    //#endregion


    //#region Back-end API functions

    const persistChanges = useCallback(async (): Promise<void> => {
        if (!masterAccount || (!includeItems && !includeServants && !includeCostumes && !includeSoundtracks)) {
            return;
        }
        invokeLoadingIndicator();
        // TODO Only update dirty data types
        const update: Partial<MasterAccount> = {
            _id: masterAccount._id
        };
        if (includeItems) {
            update.resources = {
                ...masterAccount.resources,
                items: Object.entries(editData.items).map(([itemId, quantity]) => ({ itemId: Number(itemId), quantity })),
                qp: editData.qp
            };
        }
        if (includeServants) {
            update.servants = [
                ...(editData.servants as Array<MasterServant>)
            ];
            update.bondLevels = {
                ...editData.bondLevels
            };
        }
        if (includeCostumes) {
            update.costumes = [
                ...editData.costumes
            ];
        }
        if (includeSoundtracks) {
            update.soundtracks = [
                ...editData.soundtracks
            ];
        }
        try {
            await masterAccountService.updateAccount(update);
            resetLoadingIndicator();
        } catch (error: any) {
            resetLoadingIndicator();
            /*
             * Re-throw the error here. It is up to the component that calls the function to
             * determine how to handle the error.
             */
            throw error;
        }
    }, [
        editData,
        includeCostumes,
        includeItems,
        includeServants,
        includeSoundtracks,
        invokeLoadingIndicator,
        masterAccount,
        masterAccountService,
        resetLoadingIndicator
    ]);

    //#endregion

    return {
        isDataDirty,
        masterAccountEditData: editData,
        updateCostumes,
        updateItem,
        updateQp,
        addServant,
        addServants,
        updateServants,
        updateServantOrder,
        deleteServants,
        updateSoundtracks,
        revertChanges,
        persistChanges
    };

}

//#endregion
