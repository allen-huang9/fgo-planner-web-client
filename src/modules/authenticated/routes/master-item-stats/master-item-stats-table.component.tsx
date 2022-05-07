import { Box, Tooltip } from '@mui/material';
import { SystemStyleObject, Theme } from '@mui/system';
import React, { ReactNode, useMemo } from 'react';
import NumberFormat from 'react-number-format';
import { GameItemThumbnail } from '../../../../components/game/item/game-item-thumbnail.component';
import { StaticListRowContainer } from '../../../../components/list/static-list-row-container.component';
import { GameItemConstants } from '../../../../constants';
import { ThemeConstants } from '../../../../styles/theme-constants';
import { GameItemMap } from '../../../../types/data';
import { MasterItemStats, MasterItemStatsFilterOptions } from './master-item-stats.utils';

type Props = {
    stats: MasterItemStats;
    gameItemMap: GameItemMap;
    filter: Readonly<MasterItemStatsFilterOptions>;
};

const CostColumnTooltip = 'Amount needed for servant enhancements';

const CostColumnTooltipInclUnsummoned = `${CostColumnTooltip}, including servants that have not yet been summoned`;

const CostColumnTooltipInclSoundtracks = `${CostColumnTooltip} and soundtracks unlocks`;

const CostColumnTooltipInclUnsummonedAndSoundtracks = `${CostColumnTooltipInclUnsummoned}, and soundtracks unlocks`;

const UsedColumnTooltip = 'Amount used for servant enhancements';

const UsedColumnTooltipInclSoundtrack = `${UsedColumnTooltip} and soundtracks unlocks`;

const InventoryColumnTooltip = 'Current amount in inventory';

const DebtColumnTooltip = 'Amount needed for remaining servant enhancements';

const DebtColumnTooltipInclUnsummoned = `${DebtColumnTooltip}, including servants that have not yet been summoned`;

const DebtColumnTooltipInclSoundtracks = `${DebtColumnTooltip} and soundtracks unlocks`;

const DebtColumnTooltipInclUnsummonedAndSoundtracks = `${DebtColumnTooltipInclUnsummoned}, and soundtracks unlocks`;

const DifferenceColumnTooltip = 'Additional amount that needs to be acquired in order to fullfil the \'Remaining Needed\' column';

const ItemIds = [
    ...GameItemConstants.SkillGems,
    ...GameItemConstants.BronzeEnhancementMaterials,
    ...GameItemConstants.SilverEnhancementMaterials,
    ...GameItemConstants.GoldEnhancementMaterials,
    ...GameItemConstants.AscensionStatues,
    ...GameItemConstants.OtherEnhancementMaterials,
    5
];

const StyleClassPrefix = 'MasterItemStatsTable';

const StyleProps = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    [`& .${StyleClassPrefix}-header`]: {
        display: 'flex',
        pr: 2,
        pl: 4,
        py: 4,
        fontFamily: ThemeConstants.FontFamilyGoogleSans,
        fontWeight: 500,
        fontSize: '0.875rem',
        justifyContent: 'flex-end',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: 'divider'
    },
    [`& .${StyleClassPrefix}-scroll-container`]: {
        overflow: 'auto'
    },
    [`& .${StyleClassPrefix}-data-row`]: {
        display: 'flex',
        alignContent: 'center',
        alignItems: 'center',
        height: 52,
        pl: 4,
        fontSize: '0.875rem'
    },
    [`& .${StyleClassPrefix}-label-cell`]: {
        display: 'flex',
        alignContent: 'center',
        alignItems: 'center',
        width: '25%'
    },
    [`& .${StyleClassPrefix}-data-cell`]: {
        textAlign: 'center',
        width: '15%'
    }
} as SystemStyleObject<Theme>;

export const MasterItemStatsTable = React.memo(({ stats, gameItemMap, filter }: Props) => {

    const { includeUnsummonedServants, includeSoundtracks } = filter;

    const costColumnTooltip = useMemo(() => {
        if (!includeUnsummonedServants && !includeSoundtracks) {
            return CostColumnTooltip;
        } else if (includeUnsummonedServants) {
            return CostColumnTooltipInclUnsummoned;
        } else if (includeSoundtracks) {
            return CostColumnTooltipInclSoundtracks;
        } else {
            return CostColumnTooltipInclUnsummonedAndSoundtracks;
        }
    }, [includeUnsummonedServants, includeSoundtracks]);

    const usedColumnTooltip = useMemo(() => {
        if (!includeSoundtracks) {
            return UsedColumnTooltip;
        } else {
            return UsedColumnTooltipInclSoundtrack;
        }
    }, [includeSoundtracks]);

    const debtColumnTooltip = useMemo(() => {
        if (!includeUnsummonedServants && !includeSoundtracks) {
            return DebtColumnTooltip;
        } else if (includeUnsummonedServants) {
            return DebtColumnTooltipInclUnsummoned;
        } else if (includeSoundtracks) {
            return DebtColumnTooltipInclSoundtracks;
        } else {
            return DebtColumnTooltipInclUnsummonedAndSoundtracks;
        }
    }, [includeUnsummonedServants, includeSoundtracks]);

    const renderItem = (itemId: number, index: number): ReactNode => {
        const gameItem = gameItemMap[itemId];
        const stat = stats[itemId];
        if (!gameItem || !stat) {
            // TODO Throw exception
            return null;
        }

        const { inventory, used, cost, debt } = stat;

        return (
            <StaticListRowContainer key={itemId} borderBottom={index !== ItemIds.length - 1}>
                <div className={`${StyleClassPrefix}-data-row`}>
                    <div className={`${StyleClassPrefix}-label-cell`}>
                        <GameItemThumbnail
                            gameItem={gameItem}
                            size={42}
                            showBackground
                            enableLink
                        />
                        <div className="pl-4">
                            {/* TODO Make this a link */}
                            {gameItem.name}
                        </div>
                    </div>
                    <div className={`${StyleClassPrefix}-data-cell`}>
                        <NumberFormat
                            thousandSeparator
                            displayType="text"
                            value={cost}
                        />
                    </div>
                    <div className={`${StyleClassPrefix}-data-cell`}>
                        <NumberFormat
                            thousandSeparator
                            displayType="text"
                            value={used}
                        />
                    </div>
                    <div className={`${StyleClassPrefix}-data-cell`}>
                        <NumberFormat
                            thousandSeparator
                            displayType="text"
                            value={inventory}
                        />
                    </div>
                    <div className={`${StyleClassPrefix}-data-cell`}>
                        <NumberFormat
                            thousandSeparator
                            displayType="text"
                            value={debt}
                        />
                    </div>
                    <div className={`${StyleClassPrefix}-data-cell`}>
                        <NumberFormat
                            thousandSeparator
                            displayType="text"
                            value={Math.max(0, debt - inventory)}
                        />
                    </div>
                </div>
            </StaticListRowContainer>
        );
    };

    return (
        <Box className={`${StyleClassPrefix}-root`} sx={StyleProps}>
            <div className={`${StyleClassPrefix}-header`}>
                <Tooltip title={costColumnTooltip} placement="top">
                    <div className={`${StyleClassPrefix}-data-cell`}>Total Needed</div>
                </Tooltip>
                <Tooltip title={usedColumnTooltip} placement="top">
                    <div className={`${StyleClassPrefix}-data-cell`}>Total Consumed</div>
                </Tooltip>
                <Tooltip title={InventoryColumnTooltip} placement="top">
                    <div className={`${StyleClassPrefix}-data-cell`}>Current Inventory</div>
                </Tooltip>
                <Tooltip title={debtColumnTooltip} placement="top" >
                    <div className={`${StyleClassPrefix}-data-cell`}>Remaining Needed</div>
                </Tooltip>
                <Tooltip title={DifferenceColumnTooltip} placement="top">
                    <div className={`${StyleClassPrefix}-data-cell`}>Deficit</div>
                </Tooltip>
            </div>
            <div className={`${StyleClassPrefix}-scroll-container`}>
                {ItemIds.map(renderItem)}
            </div>
        </Box>
    );
});
