#!/bin/bash
echo "====================================================="
echo "==================== Dapr JS SDK ===================="
echo "====================================================="
echo "Executing in $(pwd)"
echo "Description: Publish the repository build package"
echo "====================================================="

# Publish
echo "Publishing"
npm publish build/