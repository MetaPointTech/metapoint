<script setup lang="ts">
import { ref } from 'vue'
import { peer } from "metapoint"
import type { Meta } from "../../example-basic/server"
defineProps<{ msg: string }>()
const node = await peer()
const addr = (window as any).addr.reverse()
const channel = await node.connect<Meta>(addr)
const plus = await channel("plus")
const count = ref(0)
</script>

<template>
  <h1>{{ msg }}</h1>

  <p>
    {{ addr }}
  </p>

  <div class="card">
    <button type="button" @click="async () => (count = ((await plus(count)))[0])">count is {{ count }}</button>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
