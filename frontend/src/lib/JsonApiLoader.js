import { ServiceLibrary } from '@shared/ServiceLibrary.mjs';
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
    for (const {name, type, customPath} of ServiceLibrary) {
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

        const deleteItem = async (id, successCallback, errorCallback) => {
            const response = await ipFetch(customPath ? `${customPath}` : `json-api/${name}`, 'DELETE', {id});
            if (response.ok) {
                refreshData();
                if (successCallback){
                    successCallback(response);
                }
            } else {
                if (errorCallback){
                    errorCallback(response);
                }
            }
        }

        const upsertMethod = (httpMethod) => {
            return async (item, successCallback, errorCallback) => {
                const response = await ipFetch(customPath ? `${customPath}` : `json-api/${name}`, httpMethod, item);
                if (response.ok) {
                    refreshData();
                    if (successCallback){
                        successCallback(response);
                    }
                } else {
                    if (errorCallback){
                        errorCallback(response);
                    }
                }
            }
        }

        const obj = {
            [name] : computedData,
            [`refresh${capitalize(name)}`] : refreshData,
            [`delete${capitalize(name)}`] : deleteItem,
            [`create${capitalize(name)}`] : upsertMethod('POST'),
            [`update${capitalize(name)}`] : upsertMethod('PUT'),
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