## selfcrypt

A simple utility to encrypt files via the terminal. It has only node native dependencies.

## Usage

```bash
npm link # install globally, you might need to restart you terminal

# encrypt a file it will append .json to the output file or you can pass the -o option to override the output file
# the output file is ann encrypted block file in JSON
selfcrypt -i somefile.txt

# decrypt an ecrypted JSON block file it will use the same name as input file and removing the last .json
# you can override the output file with -o
selfcrypt -i somefile_encrytped.txt.json

# encrypt from standard input, in case you want to encrypt a quick note or something from your clipboard
# it requires an output file
selfcrypt -o test.txt.json

# decrypt to standard output in case you just want to read a quick note
selfcrypt -do -i test.txt.json
```
