import { GameServant } from '@fgo-planner/types';
import { Inject } from '../../../decorators/dependency-injection/inject.decorator';
import { Injectable } from '../../../decorators/dependency-injection/injectable.decorator';
import { GameServantList, GameServantMap, Page, Pagination } from '../../../types/data';
import { Immutable, Nullable } from '../../../types/internal';
import { HttpUtils as Http } from '../../../utils/http.utils';
import { LoadingIndicatorOverlayService } from '../../user-interface/loading-indicator-overlay.service';

@Injectable
export class GameServantService {

    private readonly _BaseUrl = `${process.env.REACT_APP_REST_ENDPOINT}/game-servant`;

    @Inject(LoadingIndicatorOverlayService)
    private readonly _loadingIndicatorOverlayService!: LoadingIndicatorOverlayService;

    private _servantsCache: Nullable<GameServantList>;

    private _servantsCacheMap: Nullable<GameServantMap>;

    private _servantsCachePromise: Nullable<Promise<GameServantList>>;

    async getServant(id: number): Promise<Nullable<GameServant>> {
        return Http.get<Nullable<GameServant>>(`${this._BaseUrl}/${id}`);
    }

    /**
     * Asynchronously returns the cached servants list. If the data is not
     * available, returns a promise that resolves once the data is fetched and
     * cached.
     */
    async getServants(): Promise<GameServantList> {
        if (this._servantsCache) {
            /*
             * TODO Currently, the same instance of the cache array is returned every time
             * this method is called. This may need to be changed so that a deep copy of the
             * array is returned instead.
             */
            return this._servantsCache;
        }
        if (!this._servantsCachePromise) {
            const loadingIndicatorId = this._loadingIndicatorOverlayService.invoke();
            /*
             * TODO Currently, every servant is retrieved and cached with this call. This
             * may need to modify the caching system for servants so that servants are 
             * retrieved and cached only when needed.
             */
            this._servantsCachePromise = Http.get<GameServant[]>(`${this._BaseUrl}`);
            this._servantsCachePromise.then(cache => {
                this._onServantsCacheLoaded(cache);
                this._loadingIndicatorOverlayService.waive(loadingIndicatorId);
            }).catch(error => {
                this._onServantsCacheLoadError(error);
                this._loadingIndicatorOverlayService.waive(loadingIndicatorId);
            });
        }
        return this._servantsCachePromise;
    }

    /**
     * Synchronously returns the cached servants list. If the data is not available,
     * then returns null/undefined.
     */
    getServantsSync(): Nullable<GameServantList> {
        /*
         * TODO Currently, the same instance of the cache array is returned every time
         * this method is called. This may need to be changed so that a deep copy of the
         * array is returned instead.
         */
        return this._servantsCache;
    }

    /**
     * Asynchronously returns the cached servants map data. If the data is not
     * available, returns a promise that resolves once the data is fetched and
     * cached.
     */
    async getServantsMap(): Promise<GameServantMap> {
        if (!this._servantsCacheMap) {
            await this.getServants();
        }
        return this._servantsCacheMap!!;
    }

    /**
     * Synchronously returns the cached servants map data. If the data is not
     * available, then returns null/undefined.
     */
    getServantsMapSync(): Nullable<GameServantMap> {
        return this._servantsCacheMap;
    }

    async getServantsPage(pagination: Pagination): Promise<Page<GameServant>> {
        const params = {
            page: pagination.page,
            limit: pagination.size,
            sort: pagination.sort,
            direction: pagination.direction
        };
        return Http.get<Page<GameServant>>(`${this._BaseUrl}/page`, { params });
    }

    private _onServantsCacheLoaded(data: GameServantList): void {
        this._generateCacheMap(this._servantsCache = data);
        this._servantsCachePromise = null;
    }

    private _onServantsCacheLoadError(error: any): void {
        this._invalidateCache();
    }

    /**
     * @deprecated Not needed
     */
    private _invalidateCache(): void {
        this._servantsCache = null;
        this._servantsCacheMap = null;
    }

    private _generateCacheMap(servants: GameServantList): void {
        const cacheMap: Record<number, Immutable<GameServant>> = {};
        for (const servant of servants) {
            cacheMap[servant._id] = servant;
        }
        this._servantsCacheMap = cacheMap;
    }

}
