<template>
    <!--
        The card is a div so the action buttons can sit next to the clickable body. Nesting a <button>
        inside a <button> (the card) is invalid HTML and breaks keyboard and screen reader use.
    -->
    <div v-for="item in items" :key="itemKey(item)" class="listButton">
        <div
            v-if="selectable"
            class="listBody clickable"
            role="button"
            tabindex="0"
            @click="emit('select', item)"
            @keydown.enter.self.prevent="emit('select', item)"
            @keydown.space.self.prevent="emit('select', item)"
        >
            <slot :item="item" />
        </div>
        <div v-else class="listBody">
            <slot :item="item" />
        </div>
        <div v-if="actions?.length" class="actionContainer">
            <button
                v-for="action in actions"
                :key="action[0]"
                type="button"
                class="clickable"
                :title="action[2]"
                :aria-label="action[2] || action[0]"
                @click="action[1](item)"
            >
                <font-awesome-icon :icon="['fas', action[0]]" />
            </button>
        </div>
    </div>
    <button
        v-if="showAdd"
        type="button"
        class="listButton listAddButton clickable"
        :title="addLabel"
        :aria-label="addLabel"
        @click="emit('create')"
    >
        <div class="addButtonCenter">
            <font-awesome-icon :icon="['fas', 'plus']" />
        </div>
    </button>
</template>

<script setup>
import { defineEmits, defineProps } from 'vue';

const emit = defineEmits(['create', 'select']);

const itemKey = (item) => item?.id ?? JSON.stringify(item);

defineProps({
    showAdd: {
        type: Boolean,
        required: false,
        default: true,
    },
    items: Array,
    // [icon, handler, label] tuples shown as buttons along the bottom of each card
    actions: Array,
    // Clicking (or pressing Enter/Space on) a card emits "select" with the item
    selectable: {
        type: Boolean,
        default: false,
    },
    addLabel: {
        type: String,
        default: 'Add',
    },
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

    .listBody {
        height: 100%;
        box-sizing: border-box;
        border-radius: 3px;

        &:focus-visible {
            outline: 2px solid @primary-color;
            outline-offset: 4px;
        }
    }

    .actionContainer {
        text-align: right;
        position: absolute;
        width: 270px;
        bottom: 0px;
        padding-bottom: 0.5rem;
        // Let clicks on the empty part of the strip fall through to the card body
        pointer-events: none;

        button {
            pointer-events: auto;
            min-width: 32px;
            min-height: 32px;
            background: none;
            border: none;
            color: white;
            cursor: pointer;

            &:hover {
                color: @brand-color;
            }

            &:focus-visible {
                outline: 2px solid @primary-color;
                border-radius: 4px;
            }
        }
    }
}
</style>
