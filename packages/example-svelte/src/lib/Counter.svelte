<script lang="ts">
  import { peer } from 'metapoint'
  // @ts-ignore
  import type { Meta } from '../../example/server'

  const main = async () => {
    const node = await peer()
    const channel = await node.connect<Meta>(window['addr'])
    return await channel("plus")
  }

  let count: number = 0
</script>

{#await main()}
	<p>connecting...</p>
{:then plus}
	<button on:click={async ()=>count = (await plus(count))[0]}>
    count is {count}
  </button>
{:catch error}
	<p style="color: red">{error.message}</p>
{/await}
