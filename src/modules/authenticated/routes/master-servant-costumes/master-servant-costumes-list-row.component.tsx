import { Immutable } from '@fgo-planner/common-core';
import { GameServant, GameServantCostume } from '@fgo-planner/data-core';
import { Checkbox } from '@mui/material';
import { isEmpty } from 'lodash-es';
import React, { ChangeEvent, ReactNode, useCallback, useMemo } from 'react';
import { DataTableListStaticRow } from '../../../../components/data-table-list/data-table-list-static-row.component';
import { GameItemQuantity } from '../../../../components/game/item/game-item-quantity.component';
import { GameServantThumbnail } from '../../../../components/game/servant/game-servant-thumbnail.component';
import { TruncateText } from '../../../../components/text/truncate-text.component';
import { useGameItemMap } from '../../../../hooks/data/use-game-item-map.hook';

export type MasterServantCostumeRowData = Immutable<GameServantCostume & {
    costumeId: number;
    servant: GameServant;
}>;

type Props = {
    costume: MasterServantCostumeRowData;
    onChange: (costumeId: number, unlocked: boolean) => void;
    openLinksInNewTab?: boolean;
    unlocked?: boolean;
};

const ServantThumbnailSize = 52;

export const StyleClassPrefix = 'MasterServantCostumesListRow';

export const MasterServantCostumesListRow = React.memo((props: Props) => {

    const {
        costume: {
            collectionNo,
            costumeId,
            materials,
            name,
            servant
        },
        onChange,
        openLinksInNewTab,
        unlocked
    } = props;

    const gameItemMap = useGameItemMap();

    const handleUnlockCheckboxChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        onChange(costumeId, event.target.checked);
    }, [costumeId, onChange]);

    const alwaysUnlocked = isEmpty(materials.materials);

    const unlockedStatusNode: ReactNode = (
        <div className={`${StyleClassPrefix}-unlocked-status`}>
            {!alwaysUnlocked && <Checkbox
                checked={unlocked}
                onChange={handleUnlockCheckboxChange}
            />}
        </div>
    );

    const unlockMaterialNodes: ReactNode = useMemo((): ReactNode => {
        if (!gameItemMap || alwaysUnlocked) {
            return null;
        }
        const nodes: Array<JSX.Element> = [];
        for (const [key, quantity] of Object.entries(materials.materials)) {
            const itemId = Number(key);
            const unlockMaterial = gameItemMap[itemId];
            if (!unlockMaterial) {
                continue;
            }
            nodes.push(
                <GameItemQuantity key={itemId} gameItem={unlockMaterial} quantity={quantity} />
            );
        }
        return nodes;
    }, [alwaysUnlocked, gameItemMap, materials.materials]);

    return (
        <DataTableListStaticRow
            className={`${StyleClassPrefix}-root`}
            borderBottom
        >
            {unlockedStatusNode}
            <GameServantThumbnail
                variant='rounded'
                size={ServantThumbnailSize}
                gameServant={servant}
                costumeId={costumeId}
                enableLink
                openLinkInNewTab={openLinksInNewTab}
            />
            <div className={`${StyleClassPrefix}-collection-no`}>
                {collectionNo}
            </div>
            <TruncateText className={`${StyleClassPrefix}-name`}>
                {name}
            </TruncateText>
            <div className={`${StyleClassPrefix}-unlock-materials`}>
                {unlockMaterialNodes}
            </div>
        </DataTableListStaticRow>
    );

});
