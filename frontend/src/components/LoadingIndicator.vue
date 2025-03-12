<template>
    <div :class="className" :style="{ height: sizeInPx }">
      <div class="ripple-container" :style="{ width: sizeInPx, height: sizeInPx }">
        <div
          v-for="n in 3"
          :key="n"
          :class="[rippleClassName]"
          :style="{ width: sizeInPx, height: sizeInPx, animationDelay: `${-0.8 + 0.2 * n}s` }"
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed, defineProps } from 'vue';

  const props = defineProps({
      className: {
        type: String,
        default: 'loading', // Fallback to default 'loading' class
      },
      rippleClassName: {
        type: String,
        default: 'ripple', // Fallback to default 'ripple' class
      },
      size: {
        type: Number,
        default: 50, // Default size is 50
      },
  });

  const sizeInPx = computed(() => `${props.size}px`);
  </script>
  
  <style scoped>
  .loading {
    margin-top: 20px;
    text-align: center;
  }
  
  .ripple-container {
    position: relative;
    display: inline-block;
  }
  
  .ripple {
    position: absolute;
    border: 2px solid white;
    border-radius: 100%;
    animation: rippleContainer 1.25s 0s infinite cubic-bezier(0.21, 0.53, 0.56, 0.8);
    animation-fill-mode: both;
  }
  
  @keyframes rippleContainer {
    0% {
      opacity: 1;
      transform: scale(0.1);
    }
  
    70% {
      opacity: 0.7;
      transform: scale(1);
    }
  
    100% {
      opacity: 0;
    }
  }
  </style>
  