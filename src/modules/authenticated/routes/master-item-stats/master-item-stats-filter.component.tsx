import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { MasterItemStatsFilterOptions } from './master-item-stats.utils';

type Props = {
    onFilterChange: (filter: MasterItemStatsFilterOptions) => void;
};

export const MasterItemStatsFilter = React.memo(({ onFilterChange }: Props) => {

    const [includeUnsummonedServants, setIncludeUnsummonedServants] = useState<boolean>(false);
    const [includeAppendSkills, setIncludeAppendSkills] = useState<boolean>(false);
    const [includeCostumes, setIncludeCostumes] = useState<boolean>(true);
    const [includeSoundtracks, setIncludeSoundtracks] = useState<boolean>(false);

    useEffect(() => {
        onFilterChange({
            includeUnsummonedServants,
            includeAppendSkills,
            includeCostumes,
            includeSoundtracks
        });
    }, [
        includeCostumes,
        includeAppendSkills,
        includeSoundtracks,
        includeUnsummonedServants,
        onFilterChange
    ]);

    const handleIncludeUnsummonedServantsChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setIncludeUnsummonedServants(event.target.checked);
    }, []);

    const handleIncludeAppendSkillsChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setIncludeAppendSkills(event.target.checked);
    }, []);

    const handleIncludeCostumesChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setIncludeCostumes(event.target.checked);
    }, []);

    const handleIncludeSoundtracksChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setIncludeSoundtracks(event.target.checked);
    }, []);

    return (
        <div className="px-4 pt-4">
            <FormGroup row>
                <FormControlLabel
                    control={
                        <Checkbox
                            name="includeUnsummonedServants"
                            checked={includeUnsummonedServants}
                            onChange={handleIncludeUnsummonedServantsChange}
                        />
                    }
                    label="Un-summoned servants"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            name="includeAppendSkills"
                            checked={includeAppendSkills}
                            onChange={handleIncludeAppendSkillsChange}
                        />
                    }
                    label="Append skills"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            name="includeCostumes"
                            checked={includeCostumes}
                            onChange={handleIncludeCostumesChange}
                        />
                    }
                    label="Costumes"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            name="includeSoundtracks"
                            checked={includeSoundtracks}
                            onChange={handleIncludeSoundtracksChange}
                        />
                    }
                    label="Soundtracks"
                />
            </FormGroup>
        </div>
    );
});
