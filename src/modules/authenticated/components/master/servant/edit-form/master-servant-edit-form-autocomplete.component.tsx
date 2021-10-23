import { GameServant } from '@fgo-planner/types';
import { Autocomplete, FilterOptionsState, TextField } from '@mui/material';
import { SxProps, Theme } from '@mui/system';
import React, { ChangeEvent, CSSProperties, HTMLAttributes, ReactNode, useCallback, useMemo } from 'react';
import { GameServantClassIcon } from '../../../../../../components/game/servant/game-servant-class-icon.component';
import { useGameServantMap } from '../../../../../../hooks/data/use-game-servant-map.hook';
import { GameServantUtils } from '../../../../../../utils/game/game-servant.utils';

type ServantOption = Readonly<{
    label: string,
    servant: Readonly<GameServant>
}>;

type Props = {
    selectedServant: GameServant;
    size?: 'small' | 'medium';
    disabled?: boolean;
    onChange?: (event: ChangeEvent<{}>, value: Readonly<GameServant>) => void;
};

const optionStyles = {
    root: {
        display: 'flex',
        /**
         * This fixes text truncation issues inside flex box.
         * @see https://css-tricks.com/flexbox-truncated-text/
         */
        minWidth: 0
    } as CSSProperties,
    rarity: {
        minWidth: 28
    } as CSSProperties,
    classIcon: {
        px: 1
    } as SxProps<Theme>
};

const generateServantOption = (servant: Readonly<GameServant>): ServantOption => {
    const label = servant.metadata?.displayName || servant.name || String(servant._id);
    return { label, servant };
};

const filterOptions = (options: Array<ServantOption>, state: FilterOptionsState<ServantOption>): Array<ServantOption> => {
    const inputValue = state.inputValue.trim();
    if (!inputValue) {
        return options;
    }
    const servants = options.map(o => o.servant);
    return GameServantUtils
        .filterServants(inputValue, servants)
        .map(generateServantOption);
};

const isOptionSelected = (option: Readonly<ServantOption>, value: Readonly<ServantOption>): boolean => {
    return option.label === value.label;
};

const renderOption = (props: HTMLAttributes<HTMLLIElement>, option: Readonly<ServantOption>): ReactNode => {
    const { servant, label } = option;
    return (
        <li {...props} key={servant._id}>
            <div style={optionStyles.root}>
                <div style={optionStyles.rarity}>
                    {`${servant.rarity} \u2605`}
                </div>
                <GameServantClassIcon
                    servantClass={servant.class}
                    rarity={servant.rarity}
                    sx={optionStyles.classIcon}
                />
                <div className="truncate">
                    {label}
                </div>
            </div>
        </li>
    );
};

const renderInput = (params: any): ReactNode => {
    return <TextField {...params} label="Servant" variant="outlined" />;
};

export const MasterServantEditFormAutocomplete = React.memo((props: Props) => {

    const {
        selectedServant,
        size,
        disabled,
        onChange
    } = props;

    // const gameServantList = useGameServantList();

    const gameServantMap = useGameServantMap();

    const options = useMemo((): ReadonlyArray<ServantOption> => {
        const options: Array<ServantOption> = [];
        if (!gameServantMap) {
            return options;
        }
        for (const servant of Object.values(gameServantMap)) {
            options.push(generateServantOption(servant));
        }
        return options;
    }, [gameServantMap]);

    const selectedOption = useMemo((): ServantOption | undefined => {
        if (!selectedServant) {
            return undefined;
        }
        return generateServantOption(selectedServant);
    }, [selectedServant]);

    const handleChange = useCallback((event: ChangeEvent<{}>, value: ServantOption | null): void => {
        if (value === null) {
            // Is this case even possible?
            return;
        }
        onChange && onChange(event, value.servant);
    }, [onChange]);

    if (disabled) {
        return (
            <TextField
                variant="outlined"
                size={size}
                fullWidth
                label="Servant"
                value={selectedServant.name}
                disabled
            />
        );
    }

    return (
        <Autocomplete
            autoHighlight
            autoSelect
            fullWidth
            size={size}
            options={options}
            noOptionsText="No results"
            isOptionEqualToValue={isOptionSelected}
            filterOptions={filterOptions}
            renderOption={renderOption}
            renderInput={renderInput}
            onChange={handleChange}
            value={selectedOption}
        />
    );

});
