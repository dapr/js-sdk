describe('General', () => {
  it('should allow us to use promises as some testing libraries have issues within the Node Ecosystem', async () => {
    const mock = jest.fn(() => {
      return new Promise((resolve) => setTimeout(resolve, 500));
    });

    const handler = jest.fn();

    await mock().then(handler);

    await (new Promise(resolve => setTimeout(resolve, 2000)));

    expect(handler).toHaveBeenCalled();
  });
});
