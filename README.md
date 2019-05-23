# ftpcp

**ftpcp**  is a command line utility that allows you to copy files between two locations.

With **ftpcp**, you can copy a files

  - From your local system to a remote system.
  - From a remote system to your local system.
  - Between two remote systems from your local system.

<img src='https://raw.githubusercontent.com/sunilmore690/ftp2sftp/master/demo.png' alt='ftpcp Demo'>

# Installation

Either through cloning with git or by using [npm](http://npmjs.org) (the recommended way):

```bash
npm install -g ftpcp
```

And nodemon will be installed globally to your system path.

If you don't want to install this package globally use npx to use this package

```bash
npx ftpcp <src> <dest>
```

# Usage


```bash
$ftpcp --help
Usage: ftpcp [options] <Source FTP/SFTP> <Dest FTP/SFTP>

Options:
  -V, --version           output the version number
  -i, --includes <items>  the List files which you want to include
  -e, --excludes <items>  the List files which you want to exclude
  -h, --help              output usage information
```

It'll transfter all files from source server to destination server

```
src/dest >> <ftp/sftp>://<username>:<password>@<Host>:<Port><DirPath>
```

Eg.

1. **Copy files from remote ftp server to your local dir path**

`ftpcp ftp://user:password@localhost:21/path/to/dir /usr/local/dir/`

2. **Copy files from your local dir to remote server dir**

`ftpcp /usr/local/dir/ ftp://user:password@localhost:21/path/to/dir`

3. **Copy files from one FTP remote to another SFTP remote server and viceversa.**

   `ftpcp ftp://user:password@remote1:21/path/to/dir sftp://user:password@remote2:22/path/to/dir`

   `ftpcp sftp://user:password@remote1:22/path/to/dir ftp://user:password@remote1:21/path/to/dir`
4. **Include and exclude some files**

  `ftpcp --includes *.csv,*.jpg --excludes *.zip <SRC> <DEST>`
