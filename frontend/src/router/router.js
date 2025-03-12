import { createRouter, createWebHistory } from 'vue-router';
import { inject } from 'vue';
import QueuePage from '@/views/QueuePage.vue';
import QueueInfoPage from '@/views/QueueInfoPage.vue';
import LogsPage from '@/views/LogsPage.vue';
import AboutPage from '@/views/AboutPage.vue';
import SettingsPage from '@/views/SettingsPage.vue';
import SynonymsPage from '@/views/SynonymsPage.vue';
import LoginPage from '@/views/LoginPage.vue';
import SearchPage from '@/views/SearchPage.vue';
import DownloadPage from '@/views/DownloadPage.vue';
import { getHost } from '@/lib/utils';
import OffSchedulePage from '@/views/OffSchedulePage.vue';

const routes = [
  { path: '/', redirect: '/queue' },
  { path: '/queue', component: QueuePage },
  { path: '/info', component: QueueInfoPage, name : "queueInfo"},
  { path: '/logs', component: LogsPage },
  { path: '/about', component: AboutPage },
  { path: '/settings', component: SettingsPage },
  { path: '/synonyms', component: SynonymsPage },
  { path: '/login', component: LoginPage },
  { path: '/search', component: SearchPage, name : "search" },
  { path: '/download', component: DownloadPage, name : "download" },
  { path: '/offSchedule', component: OffSchedulePage}
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return {top : 0, behaviour : "smooth"};
  }
});

router.beforeEach(async (to, _, next) => {
  if (to.path == '/login'){
      return next();
  }
  const authState = inject("authState"); // Inject global state

  try {
    const res = await fetch(`${getHost()}/auth/me`, { credentials: "include" });
    if (res.ok) {
      authState.user = await res.json(); // Store user data globally
      next();
    } else {
      authState.user = null;
      next("/login");
    }
  } catch (error) {
    authState.user = null;
    next("/login");
  }
});

export default router;
