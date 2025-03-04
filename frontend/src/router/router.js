import { createRouter, createWebHistory } from 'vue-router';
import QueuePage from '@/views/QueuePage.vue';
import LogsPage from '@/views/LogsPage.vue';
import AboutPage from '@/views/AboutPage.vue';
import SettingsPage from '@/views/SettingsPage.vue';
import SynonymsPage from '@/views/SynonymsPage.vue';

const routes = [
  { path: '/', redirect: '/queue' },
  { path: '/queue', component: QueuePage },
  { path: '/logs', component: LogsPage },
  { path: '/about', component: AboutPage },
  { path: '/settings', component: SettingsPage },
  { path: '/synonyms', component: SynonymsPage }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
