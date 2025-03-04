import { createApp } from 'vue'
import App from './App.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faTasks, faHistory, faTrash, faXmark, faBars, faCircleInfo, faCog, faFloppyDisk, faArrowsRotate, faPlus } from '@fortawesome/free-solid-svg-icons'
import router from './router/router.js';

library.add([faTasks, faHistory, faTrash, faXmark, faBars, faCircleInfo, faCog, faFloppyDisk, faArrowsRotate, faPlus])

const app = createApp(App);
app.component('font-awesome-icon', FontAwesomeIcon);
app.use(router);
app.mount('#app')
