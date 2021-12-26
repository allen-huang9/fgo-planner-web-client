import { MasterAccount, UserPreferences } from '@fgo-planner/types';
import { HttpResponseError, Nullable, PageMetadata, ReadonlyPartialArray, ThemeInfo, UserInfo } from '../../types/internal';

type MasterAccountList = Nullable<ReadonlyPartialArray<MasterAccount>>;

export class SubscriptionTopic<T = any> {
    
    static readonly Audio_BackgroundPlayStatusChange = new SubscriptionTopic<boolean>(() => false);

    static readonly Audio_SoundtrackPlayStatusChange = new SubscriptionTopic<boolean>(() => false);

    static readonly User_CurrentMasterAccountChange = new SubscriptionTopic<Nullable<MasterAccount>>(() => null);

    static readonly User_CurrentMasterAccountUpdate = new SubscriptionTopic<Nullable<MasterAccount>>(() => null);

    static readonly User_CurrentUserChange = new SubscriptionTopic<Nullable<UserInfo>>(() => null);
    
    static readonly User_CurrentUserPreferencesChange = new SubscriptionTopic<Nullable<UserPreferences>>(() => null);

    static readonly User_MasterAccountListUpdate = new SubscriptionTopic<MasterAccountList>(() => null);

    static readonly User_Unauthorized = new SubscriptionTopic<Nullable<HttpResponseError>>(() => null);
    
    static readonly UserInterface_AppBarElevatedChange = new SubscriptionTopic<boolean>(() => false);

    static readonly UserInterface_LoadingIndicatorDisplayChange = new SubscriptionTopic<boolean>(() => false);

    static readonly UserInterface_MetadataChange = new SubscriptionTopic<PageMetadata>(() => ({}));

    static readonly UserInterface_ThemeChange = new SubscriptionTopic<Nullable<ThemeInfo>>(() => null);

    constructor(readonly initializer: () => T) {

    }

}
