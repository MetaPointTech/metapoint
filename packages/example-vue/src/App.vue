<script setup lang="ts">
import { newChan } from './client';
import { ref } from 'vue';
const addr = ref<string>("")
const result = ref<number>(0)
const add = ref<any>()
const info = ref<string>("")

let chan: Awaited<ReturnType<typeof newChan>>

const test = async () => {
  try {
    if (chan) await chan.close();
    chan = await newChan(addr.value)
    add.value = await chan("numberAdd")
    info.value = JSON.stringify(add.value?.ctx?.id)
  } catch (error) {
    add.value = undefined
  }
}
</script>

<template>
  <input v-model="addr">
  <button v-on:click="test">Connect</button>
  <div v-show="add !== undefined">
    {{ info }}<br />
    <input v-model="result">
    <button v-on:click="async () => result = (await (add as any)(Number(result)))[0]">Add</button>
  </div>
</template>

