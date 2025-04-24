import { test, expect } from "bun:test";
import { Try } from "../src/index";

test("Try.catch can run synchronous function", () => {
  const [value, error] = Try.catch(() => 123)
  expect(value).toBe(123);
  expect(error).toBeUndefined()
});

test("Try.catch can catch synchronous errors", () => {
  const [value, error] = Try.catch(() => {
    throw new Error("test")
    return 123
  })
  expect(value).toBeUndefined()
  expect(error).toBeDefined()
  expect(error?.message).toBe("test")
});

test("Try.catch can run asynchronous function", async () => {
  const [value, error] = await Try.catch(async () => {
    return 456
  })
  expect(value).toBe(456);
  expect(error).toBeUndefined()
});

test("Try.catch can catch asynchronous errors", async () => {
  const [value, error] = await Try.catch(() => {
    throw new Error("test")
  })
  expect(value).toBeUndefined()
  expect(error).toBeDefined()
  expect(error?.message).toBe("test")
});