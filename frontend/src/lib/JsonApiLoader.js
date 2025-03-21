import { ServiceLibrary } from '@shared/ServiceLibrary.ts';
import { io } from 'socket.io-client';
import { computed,inject, provide, ref, watch } from 'vue';

import { ipFetch } from './ipFetch';
import { capitalize } from './utils';

const refreshMethods = [];

export default (userCallback) => {

    // Initialize the sockets
    const socket = ref(null);
    document.body.scrollTop = document.documentElement.scrollTop = 0;
    if (process.env.NODE_ENV == 'production') {
        socket.value = io();
    } else {
        const socketUrl = `http://${window.location.hostname}:4404`
        socket.value = io(socketUrl);
    }
    provide('socket', socket);


    // Initialize REST api
    for (const {name, type, customPath, microservices} of ServiceLibrary) {
        const dataRef = ref(type);
        let hasFetched = false;

        const refreshData = async (errorCallback) => {
            hasFetched = true;
            const response = await ipFetch(customPath ? customPath : `json-api/${name}`);
            if (response.ok) {
                dataRef.value = response.data;
            } else {
                if (errorCallback){
                    errorCallback(response);
                }
            }
        };
        const computedData = computed(() => {
            if (!hasFetched) {
                refreshData();
            }
            return dataRef.value;
        });

        const deleteItem = (id) => {
            return ipFetch(customPath ? `${customPath}` : `json-api/${name}`, 'DELETE', {id});
        }

        const upsertMethod = (httpMethod) => {
            return (item) => {
                return ipFetch(customPath ? `${customPath}` : `json-api/${name}`, httpMethod, item);
            }
        }

        const obj = {
            [name] : computedData,
            [`refresh${capitalize(name, false)}`] : refreshData,
            [`delete${capitalize(name, false)}`] : deleteItem,
            [`create${capitalize(name, false)}`] : upsertMethod('POST'),
            [`update${capitalize(name, false)}`] : upsertMethod('PUT'),
            ...createMicroservices(name, microservices)
        }
        console.log(`Providing ${name}`, Object.keys(obj));
        provide(name, obj);
        refreshMethods.push(refreshData);

        socket.value.on(name, (data) => {
            dataRef.value = data;
        })
    }


    const authState = inject('authState');
    watch(authState, (newAuthState) => {
        if (newAuthState.user) {
            refreshMethods.forEach((method) => method());
            userCallback(socket);
        }
    }, { immediate: true });
};

function createMicroservices(name, microservices) {
    if (microservices){
        return microservices.reduce((acc, ms) => {
            acc[createMicroserviceName(name, ms)] = createMicroservice(name, ms);
            return acc;        
        }, {});
    } else {
        return {};
    }
}

function createMicroservice(name, {method, path, params, query}){
    return (item) => {
        let url = `json-api/${name}${path}`;

        if (params){
            params.forEach(({name : param}) => {
                url = url.replace(`{${param}}`, item[param]);
            });
        }
        
        if (query){
            const queryString = query.map(({name:q}) => `${q}=${item[q]}`).join('&');
            url = `${url}?${queryString}`;
        }

        return ipFetch(url, method, method != 'GET' ? item : undefined);
    }
}

function createMicroserviceName(name, {name : msName}){
    return `${name}${capitalize(msName.replace('/', ''), false)}`;
}