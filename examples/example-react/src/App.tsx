import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import type { Meta } from '../../example-basic/server'
import { peer } from 'metapoint'

const node = await peer()
const channel = await node.connect<Meta>((window as any)['addr'].reverse())
const plus = await channel("add")

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <div>
        <a href="https://sovlookup.github.io/metapoint" target="_blank">
          <img src="https://sovlookup.github.io/metapoint/logo.svg" className="logo"  alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>MetaPoint + React</h1>
      <p>
       { (window as any).addr.join("\n")}
      </p>
      <div className="card">
        <button onClick={async () => {
            const res = await plus(count)
            return setCount(res[0])
          }}>
          count is {count}
        </button>
      </div>
    </div>
  )
}

export default App
