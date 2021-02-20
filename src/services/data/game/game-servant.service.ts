import { GameServant, Nullable, Page, Pagination, ReadonlyRecord } from '../../../types';
import { HttpUtils as Http } from '../../../utils/http.utils';
import { LoadingIndicatorOverlayService } from '../../user-interface/loading-indicator-overlay.service';

type ServantsCache = ReadonlyArray<Readonly<GameServant>>;

type ServantsCacheMap = ReadonlyRecord<number, Readonly<GameServant>>;

export class GameServantService {

    private static readonly _BaseUrl = `${process.env.REACT_APP_REST_ENDPOINT}/game-servant`;

    private static _servantsCache: Nullable<ServantsCache>;

    private static _servantsCacheMap: Nullable<ServantsCacheMap>;

    private static _servantsCachePromise: Nullable<Promise<ServantsCache>>;

    static async getServant(id: number): Promise<Nullable<GameServant>> {
        return Http.get<Nullable<GameServant>>(`${this._BaseUrl}/${id}`);
    }

    static async getServants(): Promise<ServantsCache> {
        if (this._servantsCache) {
            /*
             * Currently, the same instance of the cache array is returned every time this
             * method is called. This may need to be changed to pass a deep copy of the
             * array.
             */
            return this._servantsCache;
        }
        if (!this._servantsCachePromise) {
            const loadingIndicatorId = LoadingIndicatorOverlayService.invoke();
            /*
             * TODO Currently, every servant is retrieved and cached with this call. This
             * may need to modify the caching system for servants so that servants are 
             * retrieved and cached only when needed.
             */
            this._servantsCachePromise = Http.get<GameServant[]>(`${this._BaseUrl}`);
            this._servantsCachePromise.then(cache => {
                this._onServantsCacheLoaded(cache);
                LoadingIndicatorOverlayService.waive(loadingIndicatorId);
            }).catch(error => {
                this._onServantsCacheLoadError(error);
                LoadingIndicatorOverlayService.waive(loadingIndicatorId);
            });
        }
        return this._servantsCachePromise;
    }

    static async getServantsMap(): Promise<ServantsCacheMap> {
        if (!this._servantsCacheMap) {
            await this.getServants();
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this._servantsCacheMap!!;
    }

    static async getServantsPage(pagination: Pagination): Promise<Page<GameServant>> {
        const params = {
            page: pagination.page,
            limit: pagination.size,
            sort: pagination.sort,
            direction: pagination.direction
        };
        return Http.get<Page<GameServant>>(`${this._BaseUrl}/page`, { params });
    }

    private static _onServantsCacheLoaded(data: ReadonlyArray<GameServant>): void {
        this._generateCacheMap(this._servantsCache = data);
        this._servantsCachePromise = null;
    }

    private static _onServantsCacheLoadError(error: any): void {
        this._invalidateCache();
    }

    private static _invalidateCache(): void {
        this._servantsCache = null;
        this._servantsCacheMap = null;
    }

    private static _generateCacheMap(servants: ReadonlyArray<GameServant>): void {
        const cacheMap: Record<number, Readonly<GameServant>> = {};
        for (const servant of servants) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            cacheMap[servant._id!!] = servant;
        }
        this._servantsCacheMap = cacheMap;
    }

}
