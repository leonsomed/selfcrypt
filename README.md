## selfcrypt

A simple utility to encrypt files via the terminal. It has only node native dependencies.

## Usage

```bash
npm link # install globally, you might need to restart you terminal

# encrypt
selfcrypt -i somefile.txt -o somefile_encrytped
# decrypot
selfcrypt -i somefile_encrytped.txt.json -o originalfile.txt
```
