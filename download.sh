export NODE_PATH=/Users/albertdupre/Documents/node.js/bookdownload/node_modules
if [ -n $1 ]
then
    node -r @std/esm main.mjs $* 
else
    echo "Book id not provided"
fi
