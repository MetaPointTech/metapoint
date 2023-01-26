import { Evt } from "evt";

const ctx = Evt.newCtx<number>();

const a = Evt.create<string>().pipe(ctx);
