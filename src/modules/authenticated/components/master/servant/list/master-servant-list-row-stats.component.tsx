import { ObjectUtils, ReadonlyPartial } from '@fgo-planner/common-core';
import { ImmutableMasterServant, MasterServantBondLevel } from '@fgo-planner/data-core';
import React, { DOMAttributes } from 'react';
import { MasterServantListVisibleColumns } from './master-servant-list-columns';
import { MasterServantListRowBondLevel } from './master-servant-list-row-bond-level.component';
import { MasterServantListRowFouLevel } from './master-servant-list-row-fou-level.component';
import { MasterServantListRowLevel } from './master-servant-list-row-level.component';
import { MasterServantListRowNpLevel } from './master-servant-list-row-np-level.component';
import { MasterServantListRowSkillLevel } from './master-servant-list-row-skill-level.component';
import { MasterServantListRowSummonDate } from './master-servant-list-row-summon-date.component';

type Props = {
    active?: boolean;
    bond: MasterServantBondLevel | undefined;
    masterServant: ImmutableMasterServant;
    visibleColumns?: ReadonlyPartial<MasterServantListVisibleColumns>;
} & Omit<DOMAttributes<HTMLDivElement>, 'onClick' | 'onContextMenu'>;

const shouldSkipUpdate = (prevProps: Readonly<Props>, nextProps: Readonly<Props>): boolean => {
    if (!ObjectUtils.isShallowEquals(prevProps, nextProps)) {
        return false;
    }
    // Always re-render active servant rows.
    return !nextProps.active;
};

export const StyleClassPrefix = 'MasterServantListRowStats';

export const MasterServantListRowStats = React.memo((props: Props) => {

    const {
        bond,
        masterServant,
        visibleColumns
    } = props;

    const {
        npLevel,
        level,
        fouHp,
        fouAtk,
        skills,
        appendSkills,
        bondLevel,
        summonDate
    } = visibleColumns || {};

    return (
        <div className={`${StyleClassPrefix}-root`}>
            {npLevel && <MasterServantListRowNpLevel masterServant={masterServant} />}
            {level && <MasterServantListRowLevel masterServant={masterServant} />}
            {fouHp && <MasterServantListRowFouLevel fouLevel={masterServant.fouHp} />}
            {fouAtk && <MasterServantListRowFouLevel fouLevel={masterServant.fouAtk} />}
            {skills && <MasterServantListRowSkillLevel {...masterServant.skills} />}
            {appendSkills && <MasterServantListRowSkillLevel {...masterServant.appendSkills} />}
            {bondLevel && <MasterServantListRowBondLevel bondLevel={bond} />}
            {summonDate && <MasterServantListRowSummonDate date={masterServant.summonDate} />}
        </div>
    );

}, shouldSkipUpdate);
