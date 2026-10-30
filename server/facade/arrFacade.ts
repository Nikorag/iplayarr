import { ArrServiceDirectory } from '../constants/ArrServiceDirectory';
import AbstractArrService, { ArrTag } from '../service/arr/AbstractArrService';
import { App } from '../types/App';
import { CreateDownloadClientForm } from '../types/requests/form/CreateDownloadClientForm';
import { CreateIndexerForm } from '../types/requests/form/CreateIndexerForm';
import { ArrLookupResponse } from '../types/responses/arr/ArrLookupResponse';
import { DownloadClientResponse } from '../types/responses/arr/DownloadClientResponse';
import { IndexerResponse } from '../types/responses/arr/IndexerResponse';

class ArrFacade {
    upsertDownloadClient(form: CreateDownloadClientForm, app: App, allowCreate: boolean): Promise<number> {
        return this.getService(app).upsertDownloadClient(form, app, allowCreate);
    }
    getDownloadClient(app: App): Promise<DownloadClientResponse | undefined> {
        return this.getService(app).getDownloadClient(app);
    }

    upsertIndexer(form: CreateIndexerForm, app: App, allowCreate: boolean): Promise<number> {
        return this.getService(app).upsertIndexer(form, app, allowCreate);
    }
    getIndexer(app: App): Promise<IndexerResponse | undefined> {
        return this.getService(app).getIndexer(app);
    }

    testConnection(app: App): Promise<boolean | string> {
        return this.getService(app).testConnection(app);
    }

    getTags(app: App): Promise<ArrTag[]> {
        return this.getService(app).getTags(app);
    }
    createTag(app: App, label: string): Promise<ArrTag | undefined> {
        return this.getService(app).createTag(app, label);
    }
    search(app: App, term?: string): Promise<ArrLookupResponse[]> {
        return this.getService(app).search(app, term);
    }

    getService(app: App): AbstractArrService {
        return ArrServiceDirectory[app.type] as AbstractArrService;
    }
}

export default new ArrFacade();