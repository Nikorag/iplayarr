import {ServiceLibrary} from '@shared/ServiceLibrary';
import { io } from 'socket.io-client';
import {ref, computed, provide, watch, inject} from 'vue';
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
    for (const {name, path} of ServiceLibrary){
        const dataRef = ref([]);
        let hasFetched = false;

        const refreshData = async (errorCallback) => {
            hasFetched = true;
            const response = await ipFetch(`json-api${path}`);
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
            return ipFetch(`json-api${path}`, 'DELETE', {id});
        }

        const upsertMethod = (httpMethod) => {
            return (item) => {
                return ipFetch(`json-api${path}`, httpMethod, item);
            }
        }

        const obj = {
            [name] : computedData,
            [`edit${capitalize(name, false)}`] : {
                delete : deleteItem,
                create : upsertMethod('POST'),
                update : upsertMethod('PUT')
            },
            [`refresh${capitalize(name, false)}`] : refreshData,
        }
        provide(name, obj);

        refreshMethods.push(refreshData);
        socket.value.on(name, (data) => {
            dataRef.value = data;
        });
    }

    const authState = inject('authState');
    watch(authState, (newAuthState) => {
        if (newAuthState.user) {
            refreshMethods.forEach((method) => method());
            userCallback(socket);
        }
    }, { immediate: true });
}