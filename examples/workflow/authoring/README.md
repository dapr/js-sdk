# Examples - Dapr Workflow

## Running

### Activity Sequence example

```bash
# Install
npm install

# Run the example
npm run start:dapr:activity-sequence
```

### Fan out/Fan in example

```bash
# Install
npm install

# Run the example
npm run start:dapr:fanout-fanin
```

### Human Interaction in example

```bash
# Install
npm install

# Run the example
npm run start:dapr:human-interaction
```

### Schedule example

```bash
# Install
npm install

# Run the example
npm run start:dapr:schedule
```

Expected output:

```
Triggered a manual run
Schedule finished after 3 runs
Run output: "Hello Dapr!"
Run output: "Hello Dapr!"
Run output: "Hello Dapr!"
Schedule deleted
```
