// export async function testIt(name: string, fn?: any, timeout?: number): Promise<void> {
//     test(name, async () => {
//         try {
//             fn()
//         }
//         catch (error) {
//             // set failure environment variable
//             process.env.E2E_TEST_FAILURE = "true";
//         }
//     }, timeout)
// }