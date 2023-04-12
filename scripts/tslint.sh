#!/bin/bash

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep ".ts\{0,1\}$")

if [[ "$STAGED_FILES" = "" ]]; then
  exit 0
fi

PASS=true

printf "\n\rValidating Typescript:\n\r"

# Check for tslint
which ./node_modules/.bin/tslint &> /dev/null
if [[ "$?" == 1 ]]; then
  printf "\t\033[41mPlease install TSlint\033[0m"
  exit 1
fi

for FILE in $STAGED_FILES
do
  ./node_modules/.bin/tslint "$FILE"

  if [[ "$?" == 0 ]]; then
    printf "\t\033[32mTSLint Passed: $FILE\033[0m\n\r"
  else
    printf "\t\033[41mTSLint Failed: $FILE\033[0m\n\r"
    PASS=false
  fi
done

printf "\nTypescript validation completed!\n\r"

if ! $PASS; then
  printf "\033[41mCOMMIT FAILED:\033[0m \nYour commit contains files that should pass TSLint but do not. Please fix the TSLint errors and try again.\n\r"
  exit 1
else
  printf "\033[42mCOMMIT SUCCEEDED\033[0m\n\r"
fi

exit $?