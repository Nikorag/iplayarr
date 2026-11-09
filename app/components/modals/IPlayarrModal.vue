<template>
    <VueFinalModal
        v-slot="{ close }"
        class="iplayarr-modal"
        content-class="iplayarr-modal-content"
        overlay-transition="vfm-fade"
        content-transition="vfm-fade"
    >
        <legend class="modalTitle">
            <span>{{ title }}</span>
            <font-awesome-icon class="clickable" :icon="['fas', 'xmark']" @click="close()" />
        </legend>
        <div class="modal-inner">
            <slot />
            <div class="button-container floor">
                <button v-if="showCancel" class="clickable cancel" @click="emit('cancel')">
                    {{ cancelLabel }}
                </button>
                <button v-if="showClose" class="clickable cancel" @click="close()">
                    {{ closeLabel }}
                </button>
                <button v-if="showConfirm" class="clickable" @click="emit('confirm')">
                    {{ confirmLabel }}
                </button>
            </div>
        </div>
    </VueFinalModal>
</template>

<script setup>
import { defineEmits, defineProps } from 'vue';
import { VueFinalModal } from 'vue-final-modal';

defineProps({
    title: String,
    showCancel: Boolean,
    cancelLabel: String,
    showClose: Boolean,
    closeLabel: String,
    showConfirm: Boolean,
    confirmLabel: String,
});

const emit = defineEmits(['cancel', 'confirm']);
</script>

<style lang="less">
.modalTitle {
    display: flex;
    justify-content: space-between;
    width: 100%;
}
</style>
