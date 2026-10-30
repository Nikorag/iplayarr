import { defineEventHandler, readBody, setResponseStatus } from 'h3';

import { saveApp } from '../../../service/appSaveService';
import { App } from '../../../types/App';

export default defineEventHandler(async (event) => {
    const { status, body } = await saveApp((await readBody(event)) as App, 'add');
    setResponseStatus(event, status);
    return body;
});
