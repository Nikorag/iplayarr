<template>
    <button v-for="item in items" :key="JSON.stringify(item)" class="listButton clickable">
        <slot :item="item" />
        <div class="actionContainer">
            <button v-for="action in actions" :key="action[0]" class="clickable" @click="action[1](item)">
                <font-awesome-icon :icon="['fas', action[0]]" />
            </button>
        </div>
    </button>
    <button v-if="showAdd" class="listButton listAddButton clickable" @click="emit('create')">
        <div class="addButtonCenter">
            <font-awesome-icon :icon="['fas', 'plus']" />
        </div>
    </button>
</template>

<script setup>
import { defineEmits, defineProps } from 'vue';

const emit = defineEmits(['create']);

defineProps({
    showAdd: {
        type: Boolean,
        required: false,
        default: true,
    },
    items: Array,
    actions: Array,
});
</script>

<style lang="less">
.listButton {
    width: 290px;
    background-color: @nav-active-background-color;

    position: relative;
    margin: 10px;
    padding: 10px;
    border-radius: 3px;
    box-shadow: 0 0 10px 1px @primary-box-shadow;

    outline: none;
    border: 0;
    text-decoration: none;
    text-align: left;
    color: @table-text-color;
    height: 120px;

    @media (min-width: @mobile-breakpoint) {
        float: left;
    }

    @media (max-width: @mobile-breakpoint) {
        display: block;
        margin-left: auto;
        margin-right: auto;
    }

    &.listAddButton {
        text-align: center;

        .addButtonCenter {
            display: inline-block;
            padding: 5px 20px 0;
            border: 1px solid @table-border-color;
            border-radius: 4px;
            background-color: @nav-background-color;
            color: white;
            font-size: 45px;
        }
    }

    .major {
        font-size: 24px;
        font-weight: 300;
        color: @table-text-color;
    }

    .minor {
        font-size: 16px;
        color: @table-text-color;
    }

    .sub {
        font-size: 14px;
        color: @table-text-color;
    }

    .actionContainer {
        text-align: right;
        position: absolute;
        width: 270px;
        bottom: 0px;
        padding-bottom: 0.5rem;

        button {
            background: none;
            border: none;
            color: white;
        }
    }
}
</style>
