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
import { inject, provide, ref } from 'vue';
import { ModalsContainer } from 'vue-final-modal';
import { RouterView } from 'vue-router';

import { ipFetch } from '@/lib/ipFetch';

import LeftHandNav from './components/common/LeftHandNav.vue';
import NavBar from './components/common/NavBar.vue';
import { enforceMaxLength } from './lib/utils';
import JsonApiLoader from './lib/JsonApiLoader';

const authState = inject('authState');
const [queue, history, logs, socket, hiddenSettings] = [ref([]), ref([]), ref([]), ref(null), ref({})];

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
    }
}

JsonApiLoader(pageSetup);

// watch(authState, async (newAuthState) => {
//     if (newAuthState.user) {
        
//         pageSetup();
//     }
// }, { immediate: true });

const clearSearch = () => {
    navBar.value.clearSearch();
}
</script>

<style lang="less">
body {
  padding: 0px;
  margin: 0px;
  font-family: "Roboto", "open sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
  color: @primary-text-color;
  background-color: @page-background-color;
  min-height: 100vh;
}

.main-layout {
  display: flex;
}

.content {
  width: 100%;

  .inner-content {
    padding: 1rem;
  }
}

.clickable:not(:disabled) {
  cursor: pointer;
}

.pull-right {
  text-align: right;
}

@media (min-width: @mobile-breakpoint) {
  .mobileOnly {
    display: none !important;
  }
}

@media (max-width: @mobile-breakpoint) {
  .desktopOnly {
    display: none !important;
  }
}

legend {
  font-size: 21px;
  border-bottom: 1px solid @primary-text-color;
  line-height: 32.1px;
  margin-bottom: 21px;

  &.sub {
    font-size: 16px;
  }
}

.block-reset {
  display: block;
  clear: both;
}

.mb-0 {
  margin-bottom: 0px;
}

.scroll-x {
  overflow-x: auto;
}


.pill {
  padding: 1px 3px;
  font-size: 11px;
  border-radius: 2px;
  display: inline-block;
  background-color: @warn-color;
  border-color: @warn-color;
  color: @warn-text-color;
  text-align: center;

  &.TV {
    background-color: @primary-color;
    border-color: @primary-color;
    color: @primary-text-color;
  }

  &.MOVIE {
    background-color: @error-color;
    border-color: @error-color;
    color: @error-text-color;
  }

  &.primary {
    background-color: @primary-color;
    border-color: @primary-color;
    color: @primary-text-color;
  }

  &.warn {
    background-color: @warn-color;
    border-color: @warn-color;
    color: @primary-text-color;
  }

  &.success {
    background-color: @success-color;
    border-color: @success-color;
    color: @primary-text-color;
  }

  &.error {
    background-color: @error-color;
    border-color: @error-color;
    color: @error-text-color;
  }

  &.grey {
    background-color: @grey-pill-background-color;
    border-color: @grey-pill-background-color;
    color: @primary-text-color;
  }
}

input:focus,
textarea:focus,
select:focus,
button:focus {
  outline: none;
  box-shadow: none;
}

.iplayarr-modal {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.iplayarr-modal-content {
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 10px @primary-box-shadow;

  .modal-inner {
    overflow-y: auto;

    @media (min-width: @mobile-breakpoint) {
      max-height: 75vh;
    }
  }

  @media (min-width: @mobile-breakpoint) {
    min-width: 600px;
    max-width: 80%;
  }

  width: fit-content;
  background-color: @nav-background-color;

  @media (max-width: @mobile-breakpoint) {
    padding-top: 3rem;
    width: 100vw;
    height: 100vh;
    max-width: 100%;
    max-height: 100%;
    border-radius: 0;
    min-width: none;

    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .button-container {
    justify-content: flex-end;
    text-align: right;
    max-width: 650px;

    @media (max-width: @mobile-breakpoint) {
      &.floor {
        margin-top: auto;
        margin-bottom: 3rem;
      }

      box-sizing: border-box;
    }

    button {
      background-color: @settings-button-background-color;
      border: 1px solid @settings-button-border-color;
      padding: 6px 16px;
      font-size: 14px;
      color: @primary-text-color;
      border-radius: 4px;
      margin-left: 1rem;
      cursor: pointer;

      &.cancel {
        background-color: @error-color;
      }

      &:hover:not(:disabled) {
        border-color: @settings-button-hover-border-color;
        background-color: @settings-button-hover-background-color;
      }
    }
  }
}
</style>
