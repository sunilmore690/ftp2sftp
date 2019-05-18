# ftp2sftp
Transfer files from one FTP/SFTP server to another FTP/SFTP server
# Installation

Either through cloning with git or by using [npm](http://npmjs.org) (the recommended way):

```bash
npm install -g ftp2sftp
```

And nodemon will be installed globally to your system path.

If you don't want to install this package globally use npx to use this package

```bash
npx ftp2sftp <src> <dest>
```


# Usage

you need to pass 2 agument wraps your application, so you can pass all the arguments you would normally pass to your app:

```bash
ftp2sftp <src> <dest>
```

It'll transfter all files from source server to destination server
```
src/dest >> <ftp/sftp>://<username>:<password>@<Host>:<Port><DirPath>
```
Eg.

ftp://user:password@localhost:21/home/

sftp://user:password@localhost:22/home/






