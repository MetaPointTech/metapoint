<script lang="ts">
  import svelteLogo from './assets/svelte.svg'
  import Counter from './lib/Counter.svelte'
</script>

<main>
  <div>
    <a
      href="https://sovlookup.github.io/metapoint/"
      target="_blank"
      rel="noreferrer"
    >
      <img
        src="https://sovlookup.github.io/metapoint/logo.svg"
        class="logo"
        alt="MetaPoint Logo"
      />
    </a>
    <a href="https://svelte.dev" target="_blank" rel="noreferrer">
      <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
    </a>
  </div>
  <h1>MetaPoint + Svelte</h1>

  {window['addr'].join('\n')}
  <div class="card">
    <Counter />
  </div>
</main>

<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #6488ffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
</style>
