import './assets/styles/global.less';
import './registerServiceWorker';
import 'vue-final-modal/style.css';

import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { createApp, reactive } from 'vue';
import { createVfm } from 'vue-final-modal';
import VueApexCharts from 'vue3-apexcharts';

import App from './App.vue';
import router from './router/router.js';

library.add(fas);
library.add(fab);

const app = createApp(App);

const authState = reactive({ user: null });
app.provide('authState', authState);

const vfm = createVfm();
app.use(vfm);

app.use(VueApexCharts);

app.component('FontAwesomeIcon', FontAwesomeIcon);
app.use(router);
app.mount('#app');
