#!/bin/bash

# Run TypeScript type checking with less strict mode
# Using npx to find the locally installed TypeScript
# Using --noEmit to check types without generating output files
# Using --skipLibCheck to avoid checking declaration files
npx tsc --noEmit --skipLibCheck
