<template>
    <div class="LeftHandNav" ref="lhn">
      <ul>
        <li class="mobileOnly pull-right">
          <font-awesome-icon :icon="['fas', 'xmark']" @click="toggleLHN"/>
        </li>
        <LeftHandNavLink label="Queue" icon="tasks" path="/queue" @option-clicked="closeLHN"/>
        <LeftHandNavLink label="Logs" icon="history" path="/logs" @option-clicked="closeLHN"/>
        <LeftHandNavLink label="Settings" icon="cog" path="/settings" @option-clicked="closeLHN"/>
        <LeftHandNavLink label="Synonyms" icon="arrows-rotate" path="/synonyms" @option-clicked="closeLHN"/>
        <LeftHandNavLink label="About" icon="circle-info" path="/about" @option-clicked="closeLHN"/>
      </ul>
    </div>
  </template>

  <script setup>
    import {ref, defineExpose} from 'vue';
    import LeftHandNavLink from './LeftHandNavLink.vue';

    const lhn = ref(null);

    const toggleLHN = () => {
      lhn.value.classList.toggle('show');
    }

    const closeLHN = () => {
      lhn.value.classList.remove('show');
    }

    defineExpose({ toggleLHN });
  </script>
  
  <style>
  .LeftHandNav {
    width: 210px;
    background-color: rgb(42, 42, 42);
    color: rgb(225, 226, 227);
    height: 100vh;
    z-index: 3;
    font-size: 14px;
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    .LeftHandNav {
      display: none;
    }

    .LeftHandNav.show {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
    }

    .LeftHandNav li {
      border-bottom: 1px solid rgb(229, 229, 229);
      padding-bottom: 1rem;
    }
  }
  
  .LeftHandNav ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .LeftHandNav li {
    padding: 12px 24px;
  }
  
  .LeftHandNav a {
    color: rgb(225, 226, 227);
    text-decoration: none;
  }

  .active {
    background-color: rgb(51, 51, 51);
    color: rgb(225, 31, 119);
  }
  
  .LeftHandNav a:hover {
    color: rgb(225, 31, 119);
  }

  .menuText {
    margin-left: 1rem;
  }
  </style>