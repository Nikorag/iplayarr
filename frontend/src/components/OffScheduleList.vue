<template>
    <button class="cacheDefinitionButton" v-for="cacheDefinition in cacheDefinitions" v-bind:key="cacheDefinition.id">
        <div class="cacheDefinitionName">
            {{cacheDefinition.name}}
        </div>
        <div class="cacheDefinitionTarget">
            {{cacheDefinition.url}}
        </div>
        <div class="cacheDefinitionTarget">
            {{cacheDefinition.cacheRefreshed}}
        </div>
        <div class="actionContainer">
            <button class="clickable" @click="refreshDef(cacheDefinition)">
                <font-awesome-icon :icon="['fas', 'refresh']" />
            </button>
            <button class="clickable" @click="removeCacheDefinition(cacheDefinition)">
                <font-awesome-icon :icon="['fas', 'trash']" />
            </button>
        </div>
    </button>
    <button class="cacheDefinitionButton addCacheDefinitionButton clickable" @click="createCacheDefinition">
        <div class="cacheDefinitionCenter">
            <font-awesome-icon :icon="['fas', 'plus']" />
        </div>
    </button>
</template>

<script setup>
    import { defineProps, defineEmits } from 'vue';

    defineProps({
        cacheDefinitions : {
            type : Array,
            required: true
        }
    });

    const emit = defineEmits(['createCacheDefinition', 'removeCacheDefinition', 'refreshDef']);

    const removeCacheDefinition = ({name, id}) => {
        if(confirm(`Are you sure you want to remove the Cache Definition for ${name}?`)){
            emit('removeCacheDefinition', id);
        }
    };

    const createCacheDefinition = () => {
        emit('createCacheDefinition');
    }

    const refreshDef = (def) => {
        emit('refreshDef', def);
    }
</script>

<style lang="less">
    .cacheDefinitionButton {
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
        color: @primary-text-color;
        height: 100px;

        @media (min-width: @mobile-breakpoint) {
            float: left;
        }

        @media (max-width: @mobile-breakpoint) {
            display: block;
            margin-left: auto;
            margin-right: auto;
        }

        &.addCacheDefinitionButton {
            text-align: center;

            .cacheDefinitionCenter {
                display: inline-block;
                padding: 5px 20px 0;
                border: 1px solid @table-border-color;
                border-radius: 4px;
                background-color: @nav-background-color;
                color: white;
                font-size: 45px;
            }
        }

        .cacheDefinitionName {
            font-size: 24px;
        }

        .cacheDefinitionTarget {
            font-size: 10px;
        }

        .cacheDefinitionExemptions {
            font-size: 14px;
        }

        .actionContainer {
            text-align: right;

            button {
                background: none;
                border: none;
                color: white;
            }
        }
    }
</style>