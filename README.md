## selfcrypt

A simple utility to encrypt files via the terminal. It has only node native dependencies and qr which itself has only node native dependencies.

## Usage

```bash
npm link # install globally
zsh # you might need to restart you terminal
```

You can pass the `-qr` option to all of the variations and it will create a file with a QR code of the content.

Encrypts a file to an encrypted JSON block file. It will append `.json` extension to the output filename or you can pass the `-o` option to override the output filename.

```bash
selfcrypt -i somefile.txt
```

Decrypts an encrypted JSON block file. It will use the same filename as input file and remove the last `.json` extension. You can override the output file with `-o`.

```bash
selfcrypt -d -i somefile_encrytped.txt.json
```

Encrypts from standard input instead of from file system. Helpful in case you want to encrypt a quick note from your clipboard. It requires an output file.

```bash
selfcrypt -o test.txt.json
```

Decrypts to standard output in case you just want to read a quick note.

```bash
selfcrypt -do -i test.txt.json
```
