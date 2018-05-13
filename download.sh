BASE_PATH=~/scripts/bookdownload
export NODE_PATH=$NODE_PATH:$BASE_PATH/node_modules

if [ -n $1 ]
then
    node -r @std/esm $BASE_PATH/main.mjs $* 
else
    echo "Book id not provided"
fi
