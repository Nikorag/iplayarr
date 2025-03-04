<template>
  <NavBar />
  <div class="main-layout">
    <LeftHandNav ref="leftHandNav"/>
    <div class="content">
      <RouterView />
    </div>
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue';
import LeftHandNav from './components/LeftHandNav.vue';
import { RouterView } from 'vue-router';

import { io } from "socket.io-client";
import { ref, provide, onMounted } from 'vue';

const [queue, history, logs, socket] = [ref([]), ref([]), ref([]), ref(null)];

const leftHandNav = ref(null);

const updateQueue = async () => {
  const host = process.env.NODE_ENV != 'production' ? `http://${window.location.hostname}:4404` : '';
  const queueResponse = await fetch(`${host}/json-api/queue`);
  queue.value = await queueResponse.json();
  const historyResponse = await fetch(`${host}/json-api/history`);
  history.value = await historyResponse.json();
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

onMounted(async () => {
  await updateQueue();
  if (process.env.NODE_ENV == 'production'){
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
  })
});
</script>

<style>
body {
  padding: 0px;
  margin: 0px;
  font-family: "Roboto", "open sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
  color: rgb(229, 229, 229);
  background-color: rgb(32, 32, 32);
  min-height: 100vh;
}
.main-layout {
  display: flex;
}
.content {
  width: 100%;
}
.clickable {
  cursor: pointer;
}
.pull-right {
  text-align: right;
}
@media (min-width: 768px) {
  .mobileOnly {
    display: none;
  }
}

@media (max-width: 768px) {
  .desktopOnly {
    display: none;
  }
}

legend {
  font-size: 21px;
  border-bottom: 1px solid rgb(229, 229, 229);
  line-height: 32.1px;
  margin-bottom: 21px;
}

legend.sub {
  font-size: 16px;
}

.block-reset {
  display: block;
  clear: both;
}
</style>
