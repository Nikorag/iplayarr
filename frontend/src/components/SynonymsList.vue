<template>
    <button class="synonymButton" v-for="synonym in synonyms" v-bind:key="synonym.id">
        <div class="synonymName">
            {{synonym.from}}
        </div>
        <div class="synonymTarget">
            {{synonym.target}}
        </div>
        <div class="synonymExemptions">
            {{synonym.exemptions}}
        </div>
        <div class="actionContainer">
            <button class="clickable" @click="removeSynonym(synonym)">
                <font-awesome-icon :icon="['fas', 'trash']" />
            </button>
        </div>
    </button>
    <button class="synonymButton addSynonymButton clickable" @click="createSynonym">
        <div class="synonymCenter">
            <font-awesome-icon :icon="['fas', 'plus']" />
        </div>
    </button>
</template>

<script setup>
    import { defineProps, defineEmits } from 'vue';

    defineProps({
        synonyms : {
            type : Array,
            required: true
        }
    });

    const emit = defineEmits(['createSynonym', 'removeSynonym']);

    const removeSynonym = ({from, id}) => {
        if(confirm(`Are you sure you want to remove the synonym for ${from}?`)){
            emit('removeSynonym', id);
        }
    };

    const createSynonym = () => {
        emit('createSynonym');
    }
</script>

<style lang="less">
    .synonymButton {
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

        &.addSynonymButton {
            text-align: center;

            .synonymCenter {
                display: inline-block;
                padding: 5px 20px 0;
                border: 1px solid @table-border-color;
                border-radius: 4px;
                background-color: @nav-background-color;
                color: white;
                font-size: 45px;
            }
        }

        .synonymName {
            font-size: 24px;
        }

        .synonymTarget {
            font-size: 18px;
        }

        .synonymExemptions {
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