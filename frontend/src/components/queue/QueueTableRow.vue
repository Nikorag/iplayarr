<template>
  <tr>
    <td>
      <CheckInput v-model="checked" />
    </td>
    <td>
      <font-awesome-icon :class="[item.status]" :icon="['fas', getDownloadIcon(item)]" />
    </td>
    <td class="text" data-title="Filename">
      <RouterLink v-if="item.status != 'Forwarded'" :to="{ path: '/info', query: { item: JSON.stringify(item) } }">
        {{ item.nzbName }}
      </RouterLink>
      <a v-else target="_blank" :href="getAppForId(item.appId)?.link || getAppForId(item.appId)?.url || '#'">
        {{ item.nzbName }}
      </a>
    </td>
    <td>
      <span :class="['pill', item.type]">
        {{ item.type }}
      </span>
    </td>
    <td data-title="Start">
      {{ item.details.start }}
    </td>
    <td data-title="Size">
      {{ formatStorageSize(item.details.size) }}
    </td>
    <td>
      <template v-if="item.appId && getAppForId(item.appId)">
        <div class="appDisplay">
          <img class="appImg" :src="`/img/${getAppForId(item.appId).type.toLowerCase()}.svg`">
          <span class="appName">
            {{ getAppForId(item.appId).name }}
          </span>
        </div>
      </template>
    </td>
    <td class="progress-column" data-title="Progress">
      <ProgressBar :progress="item.details.progress" :status="item.status" />
    </td>
    <td data-title="ETA">
      {{ item.details.eta }}
    </td>
    <td data-title="Speed">
      {{ item.details.speed || '' }} {{ item.details.speed != '' ? 'MB/s' : '' }}
    </td>
    <td class="actionCol" data-title="Action">
      <span>
        <font-awesome-icon class="clickable" :icon="['fas', getDeleteIcon(item)]" @click="deleteRow(item)" />
      </span>
    </td>
  </tr>
</template>

<script setup>
import { defineExpose,defineProps, inject, ref } from 'vue';

import dialogService from '@/lib/dialogService';
import { ipFetch } from '@/lib/ipFetch';
import { formatStorageSize } from '@/lib/utils';

import CheckInput from '../common/form/CheckInput.vue';
import ProgressBar from '../common/ProgressBar.vue';

const props = defineProps({
    item: {
        type: Object,
        required: true
    }
});

const apps = inject('apps');
const checked = ref(false);
defineExpose({ checked, item : props.item });

const trash = async (pid) => {
    if (await dialogService.confirm('Delete', 'Are you sure you want to delete this history item?')) {
        ipFetch(`json-api/queue/history?pid=${pid}`, 'DELETE');
    }
}

const cancel = async (pid) => {
    if (await dialogService.confirm('Cancel', 'Are you sure you want to cancel this download?')) {
        ipFetch(`json-api/queue/queue?pid=${pid}`, 'DELETE');
    }
}

const deleteRow = async ({pid, status}) => {
    if (status == 'Complete' || status == 'Forwarded'){
        await trash(pid);
    } else {
        await cancel(pid);
    }
}

const getAppForId = (id) => {
    return apps.value.find(({ id: appId }) => id == appId);
}

const getDownloadIcon = ({status}) => {
    if (status == 'Complete'){
        return 'cloud-download';
    } else if (status == 'Forwarded'){
        return 'forward';
    } else {
        return 'cloud';
    }
}

const getDeleteIcon = ({status}) => {
    if (status == 'Complete' || status == 'Forwarded'){
        return 'trash';
    } else {
        return 'xmark';
    }
}
</script>

<style lang="less" scoped>
.Complete {
    color: @complete-color;
}
.Forwarded {
    color: @warn-color;
}


</style>