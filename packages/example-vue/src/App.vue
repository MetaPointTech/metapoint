<script setup lang="ts">
import { newChan } from './client';
import { ref } from 'vue';
const addr = ref<string>("")
const result = ref<number>(0)
const add = ref<((value: number) => Promise<number[]>)>()
const info = ref<string>("")
const test = async () => {
  try {
    const chan = await newChan(addr.value)
    const addf = await chan("numberAdd")
    add.value = addf
    info.value = JSON.stringify(addf.ctx.id) 
  } catch (error) {
    add.value = undefined
  }
}
</script>

<template>
  <input v-model="addr">
  <button v-on:click="test">Connect</button>
  <div v-show="add !== undefined">
    {{ info }}<br/>
  <input v-model="result">
  <button v-on:click="async ()=>result = (await (add as any)(Number(result)))[0]">Add</button>
  </div>
</template>

