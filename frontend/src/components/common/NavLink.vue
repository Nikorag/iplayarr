<template>
  <component :is="noLink ? 'span' : 'RouterLink'" :to="path">
    <li :class="[route.path === path ? 'active' : '', 'clickable']" @click="optionClicked">
      <span>
        <font-awesome-icon :icon="['fas', icon]" fixed-width />
        <span class="menuText">{{ label }}</span>
      </span>
    </li>
  </component>
</template>

<script setup>
import { defineEmits, defineProps } from 'vue';
import { useRoute } from 'vue-router';

const emit = defineEmits(['optionClicked']);
const route = useRoute();

defineProps({
    path: {
        type: String,
        required: false
    },
    label: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        required: true,
    },
    noLink: {
        type: Boolean,
        required: false,
        default: false
    }
});

const optionClicked = () => {
    emit('optionClicked');
}
</script>