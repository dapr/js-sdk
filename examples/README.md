# Examples

## Running an Example

Each example can be ran in the following way:

> ⚠ The `build` directory should exist! 

```bash
# Build main library
npm install
npm run build

# Navigate to the example
cd invoke/hello-world/

# Install dependencies
npm install

# Run the example
npm run start:dapr
```

## Creating an Example

### From existing Example

The recommended way is to copy the `hello-world` directory and adapt it to your needs. Useful commands:

* `npm run start:dev`: Start the example with a reload feature

### Initializing Typescript

> More information: [Typescript - Getting Started](https://xaviergeerinck.com/post/coding/javascript/typescript-getting-started)

```bash
# Init NPM
npm init -y

# Install Dependencies
npm install typescript ts-node nodemon rimraf --save-dev
npm install @types/node --save
./node_modules/.bin/tsc --init

# Create Base File
mkdir -p src
touch src/index.ts

# Send content to the file
cat <<EOF >> ./src/index.ts
async function main() {
  console.log("Hello World")
}
main()
.catch((e) => {
  console.error(e);
  process.exit();
})
EOF
```

