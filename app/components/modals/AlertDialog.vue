<template>
    <IPlayarrModal
        :title="title"
        :show-cancel="showCancel"
        cancel-label="Cancel"
        :show-confirm="true"
        confirm-label="OK"
        @cancel="emit('cancel')"
        @confirm="emit('confirm', selected)"
    >
        <p :class="[subtext ? 'hasLower' : '']">
            {{ text }}
        </p>
        <p v-if="subtext" class="sub">
            {{ subtext }}
        </p>
        <div class="alertDialogSelect">
            <SelectInput v-if="options" v-model="selected" :options="computedOptions" />
        </div>
    </IPlayarrModal>
</template>

<script setup>
import { computed, defineEmits, defineProps, ref } from 'vue';

import SelectInput from '../common/form/SelectInput.vue';
import IPlayarrModal from './IPlayarrModal.vue';

const emit = defineEmits(['confirm', 'cancel']);

const props = defineProps({
    title: String,
    text: String,
    subtext: String,
    showCancel: {
        type: Boolean,
        default: false,
    },
    options: Array,
});

const selected = ref(props.options ? props.options[0] : true);

const computedOptions = computed(() => {
    return props.options ? props.options.map((v) => ({ key: v, value: v })) : [];
});
</script>

<style lang="less" scoped>
p {
    &.sub {
        font-size: 14px;
        margin-top: 0px;
    }

    &.hasLower {
        margin-bottom: 0px;
    }
}
</style>
