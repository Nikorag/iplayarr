import {getServiceLibrary} from '@shared/ServiceLibrary';
import { toCamelCase } from '@shared/SharedUtils';
import { io } from 'socket.io-client';
import { computed, inject, onMounted,provide, ref, watch } from 'vue';

import { ipFetch } from './ipFetch';
import { capitalize } from './utils';

const refreshMethods = [];

export default (userCallback) => {
    const ServiceLibrary = JSON.parse(JSON.stringify(getServiceLibrary())); // Vue is messing with this object, let's deep clone it
    // Initialize the sockets
    const socket = ref(null);
    document.body.scrollTop = document.documentElement.scrollTop = 0;
    if (process.env.NODE_ENV == 'production') {
        alert('prod');
        socket.value = io();
    } else {
        const socketUrl = `http://${window.location.hostname}:4404`
        socket.value = io(socketUrl);
    }
    provide('socket', socket);

    // Initialize REST api
    for (const { name, path, microservices, initial } of ServiceLibrary) {
        const dataRef = ref(initial ?? []);
        const hasFetched = ref([]);

        const [computedData, refreshData] = createComputedAndRefresh(hasFetched, path, dataRef);

        const deleteItem = async (id) => {
            const response = await ipFetch(`json-api${path}/${id}`, 'DELETE', {});
            refreshData();
            return response;
        }

        const upsertMethod = (httpMethod, path) => {
            return async (item) => {
                const response = await ipFetch(`json-api${path}`, httpMethod, item);
                refreshData();
                return response;
            }
        }

        const obj = {
            [name]: computedData,
            [`edit${capitalize(name, false)}`]: {
                delete: deleteItem,
                create: upsertMethod('POST', path),
                update: upsertMethod('PUT', path)
            },
            [`refresh${capitalize(name, false)}`]: refreshData,
        }
        if (microservices) {
            for (const microserviceName of Object.keys(microservices)) {
                const methods = microservices[microserviceName];
                for (const method of methods) {
                    if (method != 'GET'){
                        const methodName = getMicroserviceMethodName(method, microserviceName, methods.length == 1);
                        obj[methodName] = upsertMethod(method, `${path}${microserviceName}`);
                    } else {
                        const msDataRef = ref([]);
                        const [msComputedData, msRefreshData] = createComputedAndRefresh(hasFetched, `${path}${microserviceName}`, msDataRef);
                        obj[toCamelCase(microserviceName)] = msComputedData;
                        obj[toCamelCase(`refresh-${microserviceName}`)] = msRefreshData;
                    }
                }
            }
        }

        provide(name, obj);

        refreshMethods.push(refreshData);

        socket.value.on(name, (data) => {
            dataRef.value = data;
        });
    }

    const authState = inject('authState');

    onMounted(() => {
        watch(authState, (newAuthState) => {
            if (newAuthState.user) {
                refreshMethods.forEach((method) => method());
                userCallback(socket);
            }
        }, { immediate: true });
    });
}

function getMicroserviceMethodName(method, name, unique) {
    if (unique) {
        return toCamelCase(name);
    } else {
        return toCamelCase(`${getMethodAction(method)}-${name}`);
    }
}

function getMethodAction(method) {
    switch (method) {
    case 'POST':
        return 'create';
    case 'PUT':
        return 'update';
    case 'DELETE':
        return 'delete';
    default:
        return '';    
    }
}

function createComputedAndRefresh(hasFetched, path, dataRef){
    const refreshData = async (errorCallback) => {
        hasFetched.value.push(path);
        const response = await ipFetch(`json-api${path}`);
        if (response.ok) {
            dataRef.value = response.data;
        } else {
            if (errorCallback) {
                errorCallback(response);
            }
        }
    };

    const computedData = computed(() => {
        if (!hasFetched.value.includes(path)) {
            refreshData();
        }
        return dataRef.value;
    });

    return [computedData, refreshData];
}