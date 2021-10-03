import { GameItem, GameServant, GameServantEnhancement } from '@fgo-planner/types';
import { Theme } from '@mui/material';
import { StyleRules, WithStylesOptions } from '@mui/styles';
import withStyles from '@mui/styles/withStyles';
import React, { Fragment, PureComponent, ReactNode } from 'react';
import { GameItemThumbnail } from '../../../../../components/game/item/game-item-thumbnail.component';
import { LoadingIndicator } from '../../../../../components/loading-indicator.component';
import { GameItemService } from '../../../../../services/data/game/game-item.service';
import { GameServantService } from '../../../../../services/data/game/game-servant.service';
import { Nullable, WithStylesProps } from '../../../../../types/internal';
import { GameItemNotFound } from './game-item-not-found.component';

type TotalUsage = {
    ascensions: number;
    skills: number;
    costumes: number;
};

type ServantUsage = {
    servant: Readonly<GameServant>;
} & TotalUsage;

type GameItemUsage = {
    servants: ServantUsage[];
    total: TotalUsage;
};

type Props = {
    itemId: number;
} & WithStylesProps;

type State = {
    itemLoading: boolean;
    item?: GameItem | null;
    itemUsage?: GameItemUsage | null;
};

const style = (theme: Theme) => ({
    root: {
        // TODO Implement this
    }
} as StyleRules);

const styleOptions: WithStylesOptions<Theme> = {
    classNamePrefix: 'GameItemInfo'
};

export const GameItemInfo = withStyles(style, styleOptions)(class extends PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            itemLoading: true
        };

        this._loadItem(props.itemId);
    }

    componentDidUpdate(prevProps: Props) {
        const { itemId } = this.props;
        if (itemId !== prevProps.itemId) {
            this._loadItem(itemId);
        }
    }

    render(): ReactNode {
        const { item, itemLoading } = this.state;
        if (itemLoading) {
            return <LoadingIndicator />;
        }
        if (!item) {
            return <GameItemNotFound itemId={this.props.itemId} />;
        }
        return (
            <Fragment>
                <div>{item._id}</div>
                <div>{item.name}</div>
                {this._renderUsage()}
            </Fragment>
        );
    }

    private _renderUsage(): ReactNode {
        const { itemUsage, item } = this.state;
        if (!itemUsage || !item) {
            return null;
        }
        const { servants, total } = itemUsage;
        return (
            <Fragment>
                <GameItemThumbnail item={item} />
                <div className="p-2">
                    <div>Ascensions: {total.ascensions}</div>
                    <div>Per Skill (Total): {total.skills} ({total.skills * 3})</div>
                    <div>Costumes: {total.costumes}</div>
                    <div>Total: {total.ascensions + total.skills * 3 + total.costumes}</div>
                </div>
                <div>
                    {servants.map((servant, index) => (
                        <div key={index} className="flex px-2 py-1">
                            <div>{servant.servant.name}</div>
                            <div className="px-2" />
                            <div>{servant.ascensions}, {servant.skills}({servant.skills * 3}), {servant.costumes}</div>
                        </div>
                    ))}
                </div>
            </Fragment>
        );
    }

    private _loadItem(itemId: number): void {
        this.setState({ 
            itemLoading: true
        });
        GameItemService.getItem(itemId).then(async item => {
            const itemUsage = await this._computeItemUsage(item);
            this.setState({
                itemLoading: false,
                item,
                itemUsage
            });
        });
    }

    private async _computeItemUsage(item: Nullable<GameItem>): Promise<Nullable<GameItemUsage>> {
        if (!item) {
            return null;
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const itemId = item._id!!;
        const servantUsage: ServantUsage[] = [];
        const totalUsage: TotalUsage = {
            ascensions: 0,
            skills: 0,
            costumes: 0
        };
        const servants = await GameServantService.getServants();
        for (const servant of servants) {
            const { skillMaterials, ascensionMaterials } = servant;
            const costumeMaterials = Object.values(servant.costumes).map(c => c.materials);

            const skills = this._computeEnhancementsUsage(skillMaterials, itemId);
            totalUsage.skills += skills;

            const ascensions = this._computeEnhancementsUsage(ascensionMaterials, itemId);
            totalUsage.ascensions += ascensions;

            const costumes = this._computeEnhancementsUsage(costumeMaterials, itemId);
            totalUsage.costumes += costumes;

            if (skills || ascensions || costumes) {
                servantUsage.push({
                    servant,
                    skills,
                    ascensions,
                    costumes
                });
            }
        }
        return { servants: servantUsage, total: totalUsage };
    }

    private _computeEnhancementsUsage(enhancements: Record<number, GameServantEnhancement> | undefined, itemId: number): number {
        if (!enhancements) {
            return 0;
        }
        let sum = 0;
        for (const level of Object.keys(enhancements)) {
            const enhancement: GameServantEnhancement = (enhancements as any)[level];
            sum += this._computeEnhancementUsage(enhancement, itemId);
        }
        return sum;
    }

    private _computeEnhancementUsage(enhancement: GameServantEnhancement, itemId: number): number {
        let sum = 0;
        for (const material of enhancement.materials) {
            if (material.itemId === itemId) {
                sum += material.quantity;
            }
        }
        return sum;
    }

});
