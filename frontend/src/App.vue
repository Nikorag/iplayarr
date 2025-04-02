<template>
  <NavBar ref="navBar" />
  <div class="main-layout">
    <LeftHandNav v-if="authState.user" ref="leftHandNav" @clear-search="clearSearch" />
    <div class="content">
      <RouterView />
    </div>
  </div>
  <ModalsContainer />
</template>

<script setup>
import { io } from 'socket.io-client';
import { inject, provide, ref, watch } from 'vue';
import { ModalsContainer } from 'vue-final-modal';
import { RouterView } from 'vue-router';

import { ipFetch } from '@/lib/ipFetch';

import LeftHandNav from './components/common/LeftHandNav.vue';
import NavBar from './components/common/NavBar.vue';
import { enforceMaxLength } from './lib/utils';

const authState = inject('authState');
const [queue, history, logs, socket, hiddenSettings, globalSettings] = [ref([]), ref([]), ref([]), ref(null), ref({}), ref({})];

const navBar = ref(null);

const leftHandNav = ref(null);

const updateQueue = async () => {
    queue.value = (await ipFetch('json-api/queue/queue')).data;
    history.value = (await ipFetch('json-api/queue/history')).data;
}

const toggleLeftHandNav = () => {
    leftHandNav.value.toggleLHN();
}

provide('queue', queue);
provide('history', history);
provide('socket', socket);
provide('logs', logs);
provide('updateQueue', updateQueue);
provide('toggleLeftHandNav', toggleLeftHandNav);
provide('hiddenSettings', hiddenSettings);
provide('globalSettings', globalSettings);

const refreshGlobalSettings = async () => {
    globalSettings.value = (await ipFetch('json-api/config')).data;
}
provide('refreshGlobalSettings', refreshGlobalSettings);

const pageSetup = async () => {
    if (socket.value == null) {
        document.body.scrollTop = document.documentElement.scrollTop = 0;
        await updateQueue();
        if (process.env.NODE_ENV == 'production') {
            socket.value = io();
        } else {
            const socketUrl = `http://${window.location.hostname}:4404`
            socket.value = io(socketUrl);
        }

        socket.value.on('queue', (data) => {
            queue.value = data;
        });

        socket.value.on('history', (data) => {
            history.value = data;
        });

        socket.value.on('log', (data) => {
            logs.value.push(data);
            enforceMaxLength(logs.value, 5000);
        })

        hiddenSettings.value = (await ipFetch('json-api/config/hiddenSettings')).data;
        refreshGlobalSettings();
    }
}

watch(authState, async (newAuthState) => {
    if (newAuthState.user) {
        pageSetup();
    }
}, { immediate: true });

const clearSearch = () => {
    navBar.value.clearSearch();
}
</script>