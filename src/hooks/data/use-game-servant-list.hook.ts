import { useEffect, useState } from 'react';
import { GameServantList, GameServantService } from '../../services/data/game/game-servant.service';
import { Nullable } from '../../types/internal';
import { useInjectable } from '../dependency-injection/use-injectable.hook';

/**
 * Returns cached servants list from the `GameServantService`.
 * 
 * If the data is not yet available, then null/undefined is returned.
 */
export const useGameServantList = (): Nullable<GameServantList> => {

    const gameServantService = useInjectable(GameServantService);

    /*
     * Initialize the state with the game servants list. If the data is not yet
     * available, then it is initialized as null/undefined and then retrieved later.
     */
    const [gameServantList, setGameServantList] = useState<Nullable<GameServantList>>(() => gameServantService.getServantsSync());

    /*
     * Retrieve game servants list if it wasn't available during initialization.
     */
    useEffect(() => {
        if (!gameServantList) {
            gameServantService.getServants().then(setGameServantList);
        }
    }, [gameServantList, gameServantService]);

    return gameServantList;

};
