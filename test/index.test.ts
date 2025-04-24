import { test, expect } from "bun:test";
import { Try } from "../src/index";

// Can extract valurs from synchronous functions
test("Try.catch can catch synchronous values", () => {
  const [value, error] = Try.catch(() => 123)
  expect(value).toBe(123);
  expect(error).toBeUndefined()
});

// Can catch errors from synchronous functions
test("Try.catch can catch synchronous errors", () => {
  const [value, error] = Try.catch(() => {
    throw new Error("test")
    return 456
  })
  expect(value).toBeUndefined()
  expect(error).toBeDefined()
  expect(error?.message).toBe("test")
});

// Handle edge case where return type is never
test("Try.catch can catch synchronous errors (edge-case)", () => {
  const [value, error] = Try.catch(() => {
    throw new Error("test")
  })
  expect(value).toBeUndefined()
  expect(error).toBeDefined()
  expect(error?.message).toBe("test")
});

// Can extract values from async functions
test("Try.catch can catch asynchronous values", async () => {
  const [value, error] = await Try.catch(async () => {
    return 456
  })
  expect(value).toBe(456);
  expect(error).toBeUndefined()
});

// Can extract errors from async functions
test("Try.catch can catch asynchronous errors", async () => {
  const [value, error] = await Try.catch(async () => {
    throw new Error("error")
  })
  expect(value).toBeUndefined()
  expect(error).toBeDefined()
  expect(error?.message).toBe("error")
});

// Can handle promise rejections
test("Try.catch can catch promise rejections", async () => {
  const [value, error] = await Try.catch(async () => {
    return Promise.reject("error")
  })
  expect(value).toBeUndefined()
  expect(error).toBeDefined()
  expect(error?.message).toBe("error")
});

// Can handle promise resolutions
test("Try.catch can catch promise resolutions", async () => {
  const [value, error] = await Try.catch(async () => {
    return Promise.resolve(789)
  })
  expect(value).toBe(789)
  expect(error).toBeUndefined()
});