<template>
    <VueFinalModal
        v-slot="{ close }"
        class="iplayarr-modal"
        content-class="iplayarr-modal-content"
        overlay-transition="vfm-fade"
        content-transition="vfm-fade"
        :esc-to-close="true"
        :click-to-close="clickToClose"
        :lock-scroll="true"
        :aria-labelledby="titleId"
        role="dialog"
        aria-modal="true"
    >
        <div class="modal-header">
            <h2 :id="titleId" class="modalTitle">{{ title }}</h2>
            <button type="button" class="modal-close clickable" aria-label="Close" @click="close()">
                <font-awesome-icon :icon="['fas', 'xmark']" />
            </button>
        </div>
        <div ref="bodyEl" class="modal-inner" @keydown.enter="onEnter">
            <slot />
        </div>
        <div v-if="showCancel || showClose || showConfirm" class="modal-footer">
            <button v-if="showCancel" type="button" class="clickable secondary" @click="emit('cancel')">
                {{ cancelLabel }}
            </button>
            <button v-if="showClose" type="button" class="clickable secondary" @click="close()">
                {{ closeLabel }}
            </button>
            <button
                v-if="showConfirm"
                ref="confirmEl"
                type="button"
                :class="['clickable', confirmVariant]"
                :disabled="confirmDisabled || confirmLoading"
                :aria-busy="confirmLoading || undefined"
                @click="emit('confirm')"
            >
                <font-awesome-icon v-if="confirmLoading" class="spin" :icon="['fas', 'spinner']" />
                {{ confirmLabel }}
            </button>
        </div>
    </VueFinalModal>
</template>

<script setup>
import { defineEmits, defineProps, nextTick, onMounted, ref, useId } from 'vue';
import { VueFinalModal } from 'vue-final-modal';

const props = defineProps({
    title: String,
    showCancel: Boolean,
    cancelLabel: String,
    showClose: Boolean,
    closeLabel: String,
    showConfirm: Boolean,
    confirmLabel: String,
    // 'primary' for the normal action, 'danger' when confirming something destructive
    confirmVariant: {
        type: String,
        default: 'primary',
    },
    // Disables the confirm button (e.g. while the form is invalid)
    confirmDisabled: Boolean,
    // Disables the confirm button and shows a spinner while the action is running
    confirmLoading: Boolean,
    // Clicking the backdrop dismisses the modal. Turn off for forms so a stray click doesn't lose input.
    clickToClose: {
        type: Boolean,
        default: true,
    },
});

const emit = defineEmits(['cancel', 'confirm']);

const titleId = `modal-title-${useId()}`;
const bodyEl = ref(null);
const confirmEl = ref(null);

// Enter in a text field submits the form, like a native <form> would
const onEnter = (event) => {
    const target = event.target;
    if (
        props.showConfirm &&
        !props.confirmDisabled &&
        !props.confirmLoading &&
        target instanceof HTMLInputElement &&
        target.type !== 'checkbox'
    ) {
        event.preventDefault();
        emit('confirm');
    }
};

// Put the cursor in the first field so the form can be filled in straight away
onMounted(async () => {
    await nextTick();
    bodyEl.value?.querySelector('input:not([disabled]):not([type="hidden"]), select:not([disabled])')?.focus();
});
</script>

<style lang="less">
.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex: 0 0 auto;
    padding-bottom: 8px;
    margin-bottom: 1rem;
    border-bottom: 1px solid @primary-text-color;

    .modalTitle {
        margin: 0;
        font-size: 21px;
        font-weight: 500;
        line-height: 32px;
    }

    .modal-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        padding: 0;
        border: 0;
        background: transparent;
        color: @primary-text-color;
        font-size: 18px;
        cursor: pointer;

        &:hover,
        &:focus-visible {
            color: @brand-color;
            background: transparent;
            outline: none;
        }
    }
}
</style>
