export async function sleep(ms: number = 1000): Promise<void> {
  await (new Promise(resolve => setTimeout(resolve, ms)));
}

export async function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}