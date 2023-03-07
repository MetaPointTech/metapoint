<async script  lang="ts">
  import { peer } from 'metapoint'
  import type { Meta } from "../../example/server"
  import addr from './server'
  const node = await peer()
  const channel = await node.connect<Meta>(addr)
  let count: number = 0
  const increment = () => {
    count += 1
  }
</async script>

<button on:click={increment}>
  count is {count}
</button>
