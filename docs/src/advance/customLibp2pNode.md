---
title: Custom Libp2p Node
index: true
order: 9
icon: discover
category:
  - Guide
---

You can customize the libp2p node when initializing the metapoint peer

```ts {2}
import { peer } from "metapoint";
const node = await peer({ libp2p: customNode });
```
