import { Entity } from '../../entity.type';
import { MasterItem } from '../item/master-item.type';
import { MasterServantBondLevel } from '../servant/master-servant-bond-level.type';
import { MasterServant } from '../servant/master-servant.type';

export type MasterAccount = Entity<string> & {

    userId: string;

    /**
     * Account nickname.
     */
    name?: string;

    friendId?: string;

    exp?: number;

    qp: number;

    items: MasterItem[];

    servants: MasterServant[];

    costumes: number[];
    
    bondLevels: Record<number, MasterServantBondLevel>;

    soundtracks: number[];

};
