import { client } from "../src";
import { describe, expect, test } from "vitest";
import { startServer } from "./handler";
import { jsonCodec } from "./jsonCodec";
import type { Data } from "./types";
import { newNode } from "./node";

const libp2p = await newNode();
const addr = await startServer();
const defaultClient = await client(libp2p, addr);
const jsonClient = await client(libp2p, addr, { codec: jsonCodec });

describe.concurrent("Server default codec", async () => {
  test("test add handler(one2one)", async () => {
    let c = await defaultClient<number, number>("add");
    await c.send(2);
    let count = 0;
    for await (const msg of c) {
      expect(msg).toBe(3);
      count += 1;
    }
    expect(count).toBe(1);
    expect((await c.next()).value).toBe(undefined);
    expect(await c(3)).toStrictEqual([4]);
    await c.send(5);
    for await (const msg of c) {
      expect(msg).toBe(6);
    }
  });

  test("test error handler", async () => {
    try {
      const c = await defaultClient<void, void>("error");
      await c();
      // this should never run
      expect(1).toBe(2);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  test("test adding handler(one2many)", async () => {
    const c = await defaultClient<number, number>("adding");
    const my_num = Math.floor(Math.random() * 100);
    await c.send(my_num);
    let n = 1;
    for await (const msg of c) {
      expect(msg).toStrictEqual(my_num + n);
      n += 1;
    }
    expect(n).toStrictEqual(4);
  });
});

describe.concurrent("Server JSON codec", async () => {
  test("test add handler(one2one)", async () => {
    const c = await jsonClient<Data, Data>("addJson");
    await c.send({ value: 2 });
    let count = 0;
    for await (const msg of c) {
      expect(msg).toStrictEqual({ value: 3 });
      count += 1;
    }
    expect(count).toBe(1);
    expect((await c.next()).value).toBe(undefined);
  });

  test("test add handler(one2one)2", async () => {
    const c = await jsonClient<Data, Data>("addJson");
    const result = await c({ value: 2 });
    expect(result).toStrictEqual([{ value: 3 }]);
    expect((await c.next()).value).toBe(undefined);
  });

  test("test adding handler(one2many)", async () => {
    const c = await jsonClient<Data, Data>("addingJson");
    const my_num = Math.floor(Math.random() * 100);
    await c.send({ value: my_num });
    let n = 1;
    for await (const msg of c) {
      expect(msg).toStrictEqual({ value: my_num + n });
      n += 1;
    }
    expect(n).toStrictEqual(4);
  });
});

describe("Infinity output service(one2Infinity)", async () => {
  const c = await defaultClient<number, number>("repeating");
  test("Infinity out with control", async () => {
    await c.send(1);
    let count = 0;
    for await (const msg of c) {
      count += 1;
      if (count === 2) {
        await c.done();
      }
    }
    expect(count).toBe(2);
  });
});
