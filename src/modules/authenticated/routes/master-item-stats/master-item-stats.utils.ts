import { GameServantMap } from '../../../../services/data/game/game-servant.service';
import { GameSoundtrackList } from '../../../../services/data/game/game-soundtrack.service';
import { GameServant, GameServantEnhancement, MasterAccount, MasterServant } from '../../../../types';
import { MapUtils } from '../../../../utils/map.utils';

export type MasterItemStat = {
    inventory: number;
    used: number;
    cost: number;
    debt: number;
};

export type MasterItemStatsFilterOptions = {
    includeUnownedServants: boolean;
    includeCostumes: boolean;
    includeSoundtracks: boolean;
};

export type MasterItemStats = Record<number, MasterItemStat>;

export class MasterItemStatsUtils {

    // TODO Move this to constants file
    private static readonly _QPItemId = 5;

    static generateStats(
        gameServantMap: GameServantMap,
        gameSoundtrackList: GameSoundtrackList,
        masterAccount: MasterAccount,
        filter: MasterItemStatsFilterOptions
    ): MasterItemStats {

        const start = window.performance.now();

        const {
            includeUnownedServants,
            includeCostumes,
            includeSoundtracks
        } = filter;

        const stats: Record<number, MasterItemStat> = {};

        this._populateInventory(stats, masterAccount);

        const ownedServants = new Set<number>();
        const unlockedCostumes = new Set<number>(masterAccount.costumes); // TODO Only populate this when `includeCostumes` is true

        for (const masterServant of masterAccount.servants) {
            const servantId = masterServant.gameId;
            const servant = gameServantMap[servantId];
            if (!servant) {
                // TODO Log/throw error
                continue;
            }
            const isDuplicate = ownedServants.has(servantId);
            if (!isDuplicate) {
                ownedServants.add(servantId);
            }
            this._updateForOwnedServant(stats, servant, masterServant, unlockedCostumes, includeCostumes, !isDuplicate);
        }

        if (includeUnownedServants) {
            for (const servant of Object.values(gameServantMap)) {
                const servantId = servant._id;
                if (ownedServants.has(servantId)) {
                    continue;
                }
                this._updateForUnownedServant(stats, servant, includeCostumes);
            }
        }

        if (includeSoundtracks) {
            const unlockedSoundtracks = new Set<number>(masterAccount.soundtracks);
            this._updateForSoundtracks(stats, gameSoundtrackList, unlockedSoundtracks);
        }

        const end = window.performance.now();
        console.log(`Stats by class took ${(end - start).toFixed(2)}ms to compute.`);

        return stats;
    }

    private static _populateInventory(stats: Record<number, MasterItemStat>, masterAccount: MasterAccount): void {
        for (const masterItem of masterAccount.items) {
            const stat = this._instantiateItemStat();
            stat.inventory = masterItem.quantity;
            stats[masterItem.itemId] = stat;
        }
        const stat = this._instantiateItemStat();
        stat.inventory = masterAccount.qp;
        stats[this._QPItemId] = stat;
    }

    private static _updateForOwnedServant(
        stats: Record<number, MasterItemStat>,
        servant: GameServant,
        masterServant: MasterServant,
        unlockedCostumes: Set<number>,
        includeCostumes: boolean,
        isUnique: boolean
    ): void {

        const skill1 = masterServant.skills[1];
        const skill2 = masterServant.skills[2] ?? 0;
        const skill3 = masterServant.skills[3] ?? 0;

        for (const [key, skill] of Object.entries(servant.skillMaterials)) {
            const skillLevel = Number(key);
            const skillUpgradeCount =
                (skill1 > skillLevel ? 1 : 0) +
                (skill2 > skillLevel ? 1 : 0) +
                (skill3 > skillLevel ? 1 : 0);
            this._updateForServantEnhancement(stats, skill, true, 3, skillUpgradeCount);
        }

        if (servant.ascensionMaterials) {
            for (const [key, ascension] of Object.entries(servant.ascensionMaterials)) {
                const ascensionLevel = Number(key);
                const ascended = masterServant.ascension >= ascensionLevel;
                this._updateForServantEnhancement(stats, ascension, true, 1, ascended ? 1 : 0);
            }
        }

        if (isUnique && includeCostumes) {
            for (const [key, costume] of Object.entries(servant.costumes)) {
                const costumeId = Number(key);
                const costumeUnlocked = unlockedCostumes.has(costumeId);
                this._updateForServantEnhancement(stats, costume.materials, true, 1, costumeUnlocked ? 1 : 0);
            }
        }
    }

    private static _updateForUnownedServant(
        stats: Record<number, MasterItemStat>,
        servant: GameServant,
        includeCostumes: boolean
    ): void {

        for (const skill of Object.values(servant.skillMaterials)) {
            this._updateForServantEnhancement(stats, skill, false, 3);
        }
        if (servant.ascensionMaterials) {
            for (const ascension of Object.values(servant.ascensionMaterials)) {
                this._updateForServantEnhancement(stats, ascension);
            }
        }
        if (includeCostumes) {
            for (const costume of Object.values(servant.costumes)) {
                /*
                * TODO Maybe refer to the unlocked servant costumes? It shouldn't be needed
                * though, because it's not possible to unlock a costume without owning the
                * servant.
                */
                this._updateForServantEnhancement(stats, costume.materials);
            }
        }
    }

    /**
     *
     * @param stats The stats object to be updated.
     * @param enhancement The skill, ascension, or costume enhancement.
     * @param owned Whether the servant is owned by the master.
     * @param maxUpgrades This should be `3` for skills, and `1` for ascension and
     * costumes.
     * @param upgradeCount How many times this was upgraded. For ascensions and
     * costumes, this should be `1` if the upgrade has been performed, and `0` if
     * it has not been performed. For skills, this is the number of skills out of
     * the 3 that has been upgraded.
     */
    private static _updateForServantEnhancement(
        stats: Record<number, MasterItemStat>,
        enhancement: GameServantEnhancement,
        owned = false,
        maxUpgrades = 1,
        upgradeCount = 0
    ): void {

        for (const { itemId, quantity } of enhancement.materials) {
            const stat = MapUtils.getOrDefault(stats, itemId, this._instantiateItemStat);
            const cost = quantity * maxUpgrades;
            stat.cost += cost;
            if (!owned) {
                stat.debt += cost;
            } else {
                const used = upgradeCount * quantity;
                const debt = cost - used;
                stat.used += used;
                stat.debt += debt;
            }
        }

        // QP Stats
        const quantity = enhancement.qp;
        const stat = stats[this._QPItemId];
        const cost = quantity * maxUpgrades;
        stat.cost += cost;
        if (!owned) {
            stat.debt += cost;
        } else {
            const used = upgradeCount * quantity;
            const debt = cost - used;
            stat.used += used;
            stat.debt += debt;
        }
    }

    private static _updateForSoundtracks(
        stats: Record<number, MasterItemStat>,
        gameSoundtrackList: GameSoundtrackList,
        unlockedSoundtracks: Set<number>
    ): void {

        for (const { _id, material } of gameSoundtrackList) {
            if (!material) {
                continue;
            }
            const owned = unlockedSoundtracks.has(_id);
            const stat = stats[material.itemId];
            const cost = material.quantity;
            stat.cost += cost;
            if (!owned) {
                stat.debt += cost;
            } else {
                stat.used += cost;
            }
        }
    }

    private static _instantiateItemStat(): MasterItemStat {
        return {
            inventory: 0,
            used: 0,
            cost: 0,
            debt: 0
        };
    }

}
