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
import { inject, provide, ref } from 'vue';
import { ModalsContainer } from 'vue-final-modal';
import { RouterView } from 'vue-router';

import LeftHandNav from './components/common/LeftHandNav.vue';
import NavBar from './components/common/NavBar.vue';
import JsonApiLoader from './lib/JsonApiLoader';
import { enforceMaxLength } from './lib/utils';

const authState = inject('authState');
const logs = ref([]);

const navBar = ref(null);
const leftHandNav = ref(null);

const toggleLeftHandNav = () => {
    leftHandNav.value.toggleLHN();
}

provide('logs', logs);
provide('toggleLeftHandNav', toggleLeftHandNav);

const pageSetup = async (socket) => {
    document.body.scrollTop = document.documentElement.scrollTop = 0;

    if (socket.value != null) {
        socket.value.on('log', (data) => {
            logs.value.push(data);
            enforceMaxLength(logs.value, 5000);
        });
    }
}

JsonApiLoader(pageSetup);

const clearSearch = () => {
    navBar.value.clearSearch();
}
</script>