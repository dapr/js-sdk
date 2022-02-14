export async function sleep(ms = 1000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}