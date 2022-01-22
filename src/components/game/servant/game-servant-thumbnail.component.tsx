import { GameServant } from '@fgo-planner/types';
import { Avatar, AvatarProps } from '@mui/material';
import React, { PropsWithChildren, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AssetConstants } from '../../../constants';
import { Immutable } from '../../../types/internal';

type Props = PropsWithChildren<{
    servant: Immutable<GameServant>;
    stage?: 1 | 2 | 3 | 4;
    costumeId?: number;
    size?: string | number;
    variant?: AvatarProps['variant'];
    enableLink?: boolean;
    openLinkInNewTab?: boolean;
}>;

const ThumbnailBaseUrl = AssetConstants.ServantThumbnailBaseUrl;

const DefaultVariant = 'square';

const DefaultStage = 2;

const DefaultSize = 56;

export const GameServantThumbnail = React.memo((props: Props) => {

    const {
        children,
        servant,
        stage,
        costumeId,
        variant,
        enableLink,
        openLinkInNewTab
    } = props;

    let {size} = props;

    const servantId = servant._id;

    const imageUrl = useMemo(() => {
        if (costumeId) {
            return `${ThumbnailBaseUrl}/f_${costumeId}0.png`;
        }
        const imageVariant = (stage ?? DefaultStage) - 1;
        return `${ThumbnailBaseUrl}/f_${servantId}${imageVariant}.png`;
    }, [costumeId, servantId, stage]);

    size = size || DefaultSize;

    const avatar = (
        <Avatar
            src={imageUrl}
            variant={variant || DefaultVariant}
            style={{width: size, height: size}}
        >
            {children || '?'}
        </Avatar>
    );

    if (!enableLink) {
        return avatar;
    }

    const href = `/resources/servants/${servantId}`;
    const target = openLinkInNewTab ? '_blank' : undefined;
    return <Link to={href} target={target}>{avatar}</Link>;

});
