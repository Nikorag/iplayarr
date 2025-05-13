import { App } from '../../types/App';
import { CreateDownloadClientForm } from '../../types/requests/form/CreateDownloadClientForm';
import { CreateIndexerForm } from '../../types/requests/form/CreateIndexerForm';
import { ArrLookupResponse } from '../../types/responses/arr/ArrLookupResponse';
import { DownloadClientResponse } from '../../types/responses/arr/DownloadClientResponse';
import { IndexerResponse } from '../../types/responses/arr/IndexerResponse';

export interface ArrTag {
    id: number;
    label: string;
}

export default interface AbstractArrService {
    upsertDownloadClient(form: CreateDownloadClientForm, app: App, allowCreate: boolean): Promise<number>;
    getDownloadClient(app: App): Promise<DownloadClientResponse | undefined>;

    upsertIndexer(form: CreateIndexerForm, app: App, allowCreate: boolean): Promise<number>;
    getIndexer(app: App): Promise<IndexerResponse | undefined>;

    testConnection(app: App): Promise<boolean | string>;

    getTags(app: App): Promise<ArrTag[]>;
    createTag(app: App, label: string): Promise<ArrTag | undefined>;
    search(app: App, term?: string): Promise<ArrLookupResponse[]>;
}