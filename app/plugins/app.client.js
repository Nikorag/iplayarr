import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { reactive } from 'vue';
import { createVfm } from 'vue-final-modal';
import VueApexCharts from 'vue3-apexcharts';

library.add(fas);
library.add(fab);

export default defineNuxtPlugin((nuxtApp) => {
    const { vueApp } = nuxtApp;

    const authState = reactive({ user: null });
    vueApp.provide('authState', authState);

    vueApp.use(createVfm());
    vueApp.use(VueApexCharts);
    vueApp.component('FontAwesomeIcon', FontAwesomeIcon);

    return { provide: { authState } };
});
