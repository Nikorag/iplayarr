<template>
    <RouterLink :to="path">
        <li :class="[route.path === path ? 'active' : '', 'clickable']" @click="optionClicked">
            <span>
            <font-awesome-icon :icon="['fas', icon]" />
            <span class="menuText">{{label}}</span>
            </span>
        </li>
    </RouterLink>
</template>

<script setup>
    import { defineProps, defineEmits } from 'vue';
    import { useRoute } from 'vue-router';

    const emit = defineEmits(['optionClicked']);
    const route = useRoute();

    defineProps({
        path : {
            type : String,
            required: true
        },
        label : {
            type : String,
            required: true,
        },
        icon : {
            type : String,
            required: true,
        }
    });

    const optionClicked = () => {
        emit('optionClicked');
    }
</script>