if [ -n $1 ]
then
    node -r @std/esm main.mjs $* 
else
    echo "Book id not provided"
fi
