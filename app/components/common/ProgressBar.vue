<template>
    <div :class="['progress-bar', status]">
        <div class="progress" :style="{ width: progress + '%' }" />
    </div>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps({
    progress: {
        type: Number,
        required: false,
        default: 100,
    },
    status: {
        type: String,
        required: true,
    },
});
</script>

<style lang="less" scoped>
.progress-bar {
    width: 100%;
    position: relative;
    background-color: @input-background-color;
    border-radius: 5px;
    overflow: hidden;

    .progress {
        height: 15px;
        background-color: @primary-color;
    }

    &.Complete {
        .progress {
            background-color: @complete-color;
        }
    }
    &.Forwarded {
        .progress {
            background-color: @warn-color;
        }
    }
    &.Cancelled {
        .progress {
            background-color: @error-color;
        }
    }
        &.Removed {
            .progress {
                background-color: @success-color;
            }
        }
}
</style>
