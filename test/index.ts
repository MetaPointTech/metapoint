import { startServer } from "./server";
import { startClient } from "./client";

const addr = await startServer();
await startClient(addr);

process.exit();
