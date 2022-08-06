import { useCallback, useEffect, useRef } from 'react';
import { SetUtils } from '../../../utils/set.utils';
import { useForceUpdate } from '../../utils/use-force-update.hook';
import { ListSelectAction } from './list-select-action.type';

export type ListSelectHelperHookOptions = {
    /**
     * Whether selection functionality is disabled.
     */
    disabled?: boolean;
    /**
     * Whether multiple selections are allowed.
     */
    multiple?: boolean;
};

type ListSelectHelperHookResult = {
    handleItemAction: (action: ListSelectAction, index: number) => void;
    selectedIds: ReadonlySet<number>;
};

/**
 * Utility hook that handles the select actions on a list and keeps track of
 * which items are selected based on the events.
 */
export const useListSelectHelper = <T>(
    sourceData: ReadonlyArray<T>,
    selectedIds: ReadonlySet<number>,
    getIdFunction: (value: T) => number,
    options: ListSelectHelperHookOptions = {}
): ListSelectHelperHookResult => {

    const forceUpdate = useForceUpdate();

    const {
        disabled,
        multiple
    } = options;

    const sourceDataRef = useRef<ReadonlyArray<T>>(sourceData);

    const previousTargetIdRef = useRef<number>();

    const selectedIdsRef = useRef<ReadonlySet<number>>(SetUtils.emptySet());

    /**
     * Updates the `selectedDataContainer` whenever the `sourceData` reference changes.
     */
    useEffect(() => {
        if (disabled) {
            return;
        }
        let hasChanges = false;
        if (!SetUtils.isEqual(selectedIds, selectedIdsRef.current)) {
            /**
             * The only way this can change is if the set passed in as a prop does not match
             * the one returned by the hook in the previous render. As such, we will also
             * reset the previous target ID.
             */
            selectedIdsRef.current = selectedIds;
            previousTargetIdRef.current = undefined;
            hasChanges = true;
        }
        if (sourceData !== sourceDataRef.current) {
            sourceDataRef.current = sourceData;
            hasChanges = true;
        }
        if (!hasChanges) {
            return;
        }
        const updatedSelectedIds = new Set<number>();
        const updatedSelectedItems = [];
        for (const item of sourceDataRef.current) {
            const id = getIdFunction(item);
            if (selectedIdsRef.current.has(id)) {
                updatedSelectedIds.add(id);
                updatedSelectedItems.push(item);
            }
        }
        selectedIdsRef.current = updatedSelectedIds;
        forceUpdate();
    }, [disabled, sourceData, selectedIds, getIdFunction, forceUpdate]);

    const handleItemAction = useCallback((action: ListSelectAction, index: number): void => {
        if (disabled) {
            return;
        }

        const sourceData = sourceDataRef.current;
        const selectedIds = selectedIdsRef.current;

        /**
         * The target item. Assumes that the index always exists.
         */
        const targetItem = sourceData[index];
        /**
         * The ID of the target item.
         */
        const targetItemId = getIdFunction(targetItem);

        /**
         * Array containing the IDs of the updated selection.
         */
        const updatedSelectionIds: number[] = [];

        if (!multiple) {
            /**
             * In single selection mode, there is no difference in behavior between the
             * actions except for `invert-target`.
             *
             * If the action is `invert-target`, and the target item was already selected,
             * then it will be deselected. Otherwise the behavior is the same as `override`.
             */
            if (action !== 'invert-target' || !selectedIds.has(targetItemId)) {
                updatedSelectionIds.push(targetItemId);
            }
        } else {
            if (action === 'continuous') {
                /**
                 * If action is `continuous`, then look for the index of the previous action
                 * target based and do one of the following:
                 *
                 * - If a previous target ID was recorded, then all of the items between that
                 *   index and the target index index (inclusive) regardless of whether they
                 *   were already selected or not.
                 *
                 * - If a previous target index was not recorded, then change the selection to
                 *   just the target item (same behavior as `override`).
                 */
                let previousTargetIndex = -1;
                if (previousTargetIdRef.current !== undefined) {
                    const previousTargetId = previousTargetIdRef.current;
                    previousTargetIndex = sourceData.findIndex(item => getIdFunction(item) === previousTargetId);
                }
                if (previousTargetIndex === -1) {
                    updatedSelectionIds.push(targetItemId);
                } else {
                    if (selectedIds) {
                        updatedSelectionIds.push(...selectedIds);
                    }
                    if (previousTargetIndex === index) {
                        updatedSelectionIds.push(targetItemId);
                    } else {
                        const start = Math.min(previousTargetIndex, index);
                        const end = Math.max(previousTargetIndex, index);
                        for (let i = start; i <= end; i++) {
                            const itemId = getIdFunction(sourceData[i]);
                            updatedSelectionIds.push(itemId);
                        }
                    }
                }
            } else if (action === 'invert-target') {
                /**
                 * If the action is `invert-target`, then do one of the following:
                 *
                 * - If the target item was already selected, then deselect it.
                 *
                 * - If the target item was not selected, then add it to the selection.
                 */
                let alreadySelected = false;
                if (selectedIds) {
                    for (const instanceId of selectedIds) {
                        if (instanceId === targetItemId) {
                            alreadySelected = true;
                        } else {
                            updatedSelectionIds.push(instanceId);
                        }
                    }
                }
                if (!alreadySelected) {
                    updatedSelectionIds.push(targetItemId);
                }
            } else if (action === 'append-target' && selectedIds.has(targetItemId)) {
                /**
                 * If the action is `append-target` and the target item was already selected
                 * (either individually or part of a multiple selection), then just keep the
                 * current selection.
                 */
                updatedSelectionIds.push(...selectedIds);
            } else {
                /**
                 * For the remaining actions/conditions, change the selection to just the target
                 * item.
                 */
                updatedSelectionIds.push(targetItemId);
            }
        }

        /**
         * Update the previous target ID.
         */
        previousTargetIdRef.current = targetItemId;
        /**
         * Update the `selectedIdsRef` and `selectedItems`.
         */
        const updatedSelectionIdSet = new Set(updatedSelectionIds);
        selectedIdsRef.current = updatedSelectionIdSet;
        
        forceUpdate();
    }, [disabled, forceUpdate, getIdFunction, multiple]);

    return {
        handleItemAction,
        selectedIds: selectedIdsRef.current
    };

};
