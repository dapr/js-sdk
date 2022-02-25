var fs = require("fs");

const errorFilePath = "E2E_TEST_ERROR";

export async function testIt(name: string, fn?: any, timeout?: number): Promise<void> {
    test(name, async () => {
        try {
            await fn()
        }
        catch (error) {
            // Create a new file to denote error.
            touchFile(errorFilePath);
            throw error
        }
    }, timeout)
}

// Creates an empty file at filepath.
function touchFile(filepath: string) {
    fs.write(fs.openSync(filepath, 'w'));
}