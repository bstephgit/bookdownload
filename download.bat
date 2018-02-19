@ECHO OFF
IF NOT '%1'=='' node -r @std/esm main.mjs %* else  echo "Book id not provided"
