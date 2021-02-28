import { GameServantRarity, MasterServantAscensionLevel, MasterServantBondLevel, MasterServantNoblePhantasmLevel } from '../types';
import { MasterServantSkillLevel } from '../types/data/master/servant/master-servant-skill-level.type';

export class GameServantConstants {

    static readonly MinLevel = 1;

    static readonly MaxLevel = 100;

    static readonly MinFou = 0;

    static readonly MaxFou = 2000;

    static readonly MinAscensionLevel = 0;

    static readonly MaxAscensionLevel = 4;

    static readonly AscensionLevels = Array.from(Array(5).keys()) as ReadonlyArray<MasterServantAscensionLevel>;

    static readonly MinSkillLevel = 1;

    static readonly MaxSkillLevel = 10;

    static readonly SkillLevels = Array.from(Array(10).keys()).map(i => i + 1)  as ReadonlyArray<MasterServantSkillLevel>;

    static readonly MinNoblePhantasmLevel = 1;

    static readonly MaxNoblePhantasmLevel = 5;

    static readonly NoblePhantasmLevels = Array.from(Array(5).keys()).map(i => i + 1) as ReadonlyArray<MasterServantNoblePhantasmLevel>;

    static readonly MinBondLevel = 0;

    static readonly MaxBondLevel = 15;

    static readonly BondLevels = Array.from(Array(16).keys()) as ReadonlyArray<MasterServantBondLevel>;

    static readonly RarityValues = Array.from(Array(6).keys()) as ReadonlyArray<GameServantRarity>;

}