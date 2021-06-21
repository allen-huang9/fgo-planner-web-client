import { fade, makeStyles, StyleRules, Theme } from '@material-ui/core';
import { WithStylesOptions } from '@material-ui/core/styles/withStyles';
import React, { ReactNode, useCallback } from 'react';
import { useGameSoundtrackList } from '../../../../hooks/data/use-game-soundtrack-list.hook';
import { useForceUpdate } from '../../../../hooks/utils/use-force-update.hook';
import { GameSoundtrack } from '../../../../types';
import { MasterSoundtracksListRow } from './master-soundtracks-list-row.component';

type Props = {
    masterSoundtrackSet: Set<number>;
    playingId?: number;
    editMode?: boolean;
    onPlayButtonClick?: (soundtrack: GameSoundtrack, action: 'play' | 'pause') => void;
};

const SoundtrackThumbnailSize = 42;

const style = (theme: Theme) => ({
    root: {
        paddingBottom: theme.spacing(20)
    },
    row: {
        height: 52,
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(0, 4),
        fontSize: '0.875rem'
    },
    soundtrackId: {
        textAlign: 'center',
        width: theme.spacing(8)
    },
    soundtrackThumbnailContainer: {
        width: 96,
        height: SoundtrackThumbnailSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: fade('#ffffff', 0.69),
        margin: theme.spacing(0, 6)
    },
    soundtrackTitle: {

    }
} as StyleRules);

const styleOptions: WithStylesOptions<Theme> = {
    classNamePrefix: 'MasterSoundtracksList'
};

const useStyles = makeStyles(style, styleOptions);

export const MasterSoundtracksList = React.memo((props: Props) => {

    const forceUpdate = useForceUpdate();

    const {
        masterSoundtrackSet,
        playingId,
        editMode,
        onPlayButtonClick
    } = props;

    const classes = useStyles();

    const gameSoundtrackList = useGameSoundtrackList();

    const handleUnlockToggle = useCallback((id: number, value: boolean) => {
        if (value) {
            if (!masterSoundtrackSet.has(id)) {
                masterSoundtrackSet.add(id);
                forceUpdate();
            }
        } else {
            if (masterSoundtrackSet.has(id)) {
                masterSoundtrackSet.delete(id);
                forceUpdate();
            }
        }
    }, [masterSoundtrackSet, forceUpdate]);

    if (!gameSoundtrackList?.length) {
        return null;
    }

    const renderSoundtrackRow = (soundtrack: GameSoundtrack): ReactNode => {
        const soundtrackId = soundtrack._id;
        const unlocked = masterSoundtrackSet.has(soundtrackId);
        return (
            <MasterSoundtracksListRow
                key={soundtrackId}
                soundtrack={soundtrack}
                playing={soundtrackId === playingId}
                editMode={editMode}
                unlocked={unlocked}
                onPlayButtonClick={onPlayButtonClick}
                onUnlockToggle={handleUnlockToggle}
            />
        );
    };

    return (
        <div className={classes.root}>
            {gameSoundtrackList.map(renderSoundtrackRow)}
        </div>
    );

});
