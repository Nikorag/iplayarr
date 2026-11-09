<template>
    <div class="toast-container">
        <div
            v-for="toast of toasts"
            :key="toast.id"
            :class="['toast', toast.type]"
            role="alert"
            @click="toastService.dismiss(toast.id)"
        >
            {{ toast.message }}
        </div>
    </div>
</template>

<script setup>
import toastService, { toasts } from '@/lib/toastService';
</script>

<style lang="less">
.toast-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 5000;
    max-width: min(420px, calc(100vw - 40px));

    .toast {
        padding: 12px 16px;
        border-radius: 4px;
        color: @primary-text-color;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        overflow-wrap: anywhere;

        &.success {
            background-color: @success-color;
        }

        &.error {
            background-color: @error-color;
        }
    }
}
</style>
