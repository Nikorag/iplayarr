<template>
  <IPlayarrModal title="Select App">
    <ListEditor v-slot="{ item }" :show-add="false" :items="filteredApps">
      <a @click.prevent="emit('selectApp', item)">
        <div class="major">
          <img class="appImg" :src="`/img/${item.type.toLowerCase()}.svg`">
          <span class="appName">
            {{ item.name }}
          </span>
        </div>
        <div class="sub">
          {{ item.url }}
        </div>
      </a>
    </ListEditor>
  </IPlayarrModal>
</template>

<script setup>
import { defineEmits, inject,onMounted, ref } from 'vue';

import ListEditor from '../common/ListEditor.vue';
import IPlayarrModal from './IPlayarrModal.vue';

const emit = defineEmits(['selectApp', 'close']);

const {apps, types : features, refreshTypes, refreshApps} = inject('apps')
const filteredApps = ref([])

onMounted(async () => {
    await Promise.all([
        refreshTypes(),
        refreshApps()
    ]);
    filteredApps.value = apps.value.filter(({ type }) => features.value[type].includes('callback'));

    if (filteredApps.value.length == 0) {
        emit('close');
        return;
    }
})
</script>

<style lang="less" scoped>
.major {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;

  .appImg {
    width: 25px;
  }
}

.featureList {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
}
</style>