## selfcrypt

A simple utility to encrypt files via the terminal. It has only node native dependencies and qr which itself has only node native dependencies.

It encrypts files using AES-256-CBC. It passes the provided password through Argon2 KDF with a random salt. The result is a JSON encoded file with the encrypted ciphertext and settings to use for decryption. Additionally, you can specify an option to generate a QR code out of the encrypted file. The QR code is very useful for backup purposes since it can be printed to laminated paper. Also useful to transmit encrypted files to and from airgap devices via QR code scanning.

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

Encrypts a previously encrypted file again. Use this when you want to change the encryption password or update to the latest encryption version.

```bash
selfcrypt -i some_encrypted_file.json -r
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
