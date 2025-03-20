import { ref, provide, watch, inject, computed } from 'vue';
import { ipFetch } from './ipFetch';
import { ServiceLibrary } from '@shared/ServiceLibrary.mjs';
import { capitalize } from './utils';

const refreshMethods = [];

export default (userCallback) => {
    ServiceLibrary.forEach(({ name, type, customPath }) => {
        const dataRef = ref(type.default);
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

        const deleteItem = async (id, errorCallback) => {
            const response = await ipFetch(customPath ? `${customPath}` : `json-api/${name}`, 'DELETE', {id});
            if (response.ok) {
                refreshData();
            } else {
                if (errorCallback){
                    errorCallback(response);
                }
            }
        }

        const upsertMethod = (httpMethod) => {
            return async (item, errorCallback) => {
                const response = await ipFetch(customPath ? `${customPath}` : `json-api/${name}`, httpMethod, item);
                if (response.ok) {
                    refreshData();
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
        console.log("Providing", Object.keys(obj));
        provide(name, obj);
        refreshMethods.push(refreshData);
    });

    const authState = inject('authState');
    watch(authState, async (newAuthState) => {
        if (newAuthState.user) {
            refreshMethods.forEach((method) => method());
            userCallback();
        }
    }, { immediate: true });
};