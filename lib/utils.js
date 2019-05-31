const FtpClient = require("ftp");
const SFTPClient = require("ssh2-sftp-client");
const fs = require("fs");
const list = function(type, conn, dir) {
  type = type 
  if (type == "ftp") {
    return new Promise(function(resolve, reject) {
      let ftp = new FtpClient();
      ftp.connect(conn);
      ftp.on("error", function(err) {
        reject(err);
      });
      ftp.on("ready", () => {
        ftp.list(dir, function(err, list) {
          if (err) return reject(err);
          resolve(list);
          ftp.end();
        });
      });
    });
  } else if (type == "sftp") {
    let sftp = new SFTPClient();
    return new Promise(function(resolve, reject) {
      sftp
        .connect(conn)
        .then(function() {
          return sftp.list(dir);
        })
        .then(list => {
          resolve(list);
        })
        .catch(e => {
          reject(e);
        });
    });
  } else {
    return new Promise(function(resolve, reject) {
      var files = [];
      var i = 0;
      let list = fs.readdirSync(dir);
      if(!list.length){
          return resolve([])
      }
      (function next() {
        var file = list[i++];
        if (!file) {
          return next();
        }
        let path = dir + file;
        // skip ignore files
        fs.stat(path, function(err, stat) {
          if (err) {
            console.log("fs.stat failed.", err);
            //   return callback(err);
            return reject(err);
          }
          // handle files
          if (stat.isFile()) {
            files.push({
              name: file,
              size: stat.size,
              time: new Date(stat.ctime),
              type:'-'
            });
            //   console.log('files',files)
          }
          if (list.length != i) {
            next();
          } else {
            // console.log("files", files);
            resolve(files);
          }
        });
      })();
    });
  }
};
const get = function(type, conn, file, cb) {
  
  if (type == "ftp") {
    return new Promise(function(resolve, reject) {
      let ftp = new FtpClient();
      ftp.connect(conn);
      ftp.on("error", function(err) {
        reject(err);
      });
      ftp.on("ready", () => {
        ftp.get(file, function(err, stream) {
          if (err) return reject(err);
          resolve(stream);
          stream.once("close", function() {
            //   console.log('stram')
            ftp.end();
          });
          //   ftp.end();
        });
      });
    });
  } else if (type == "sftp") {
    let sftp = new SFTPClient();
    return new Promise(function(resolve, reject) {
      sftp
        .connect(conn)
        .then(function() {
          let stream = sftp.sftp.createReadStream(file, { encoding: null });
          resolve(stream);
          stream.once("close", function() {
            //   console.log('Close')
            sftp.end();
          });
        })
        .catch(e => {
          reject(e);
        });
    });
  } else {
    return new Promise(function(resolve, reject) {
      var stream;
      stream = fs.createReadStream(file);
      resolve(stream);
    });
  }
};
const put = function(type, conn, src, dest) {
  
  if (type == "ftp") {
    return new Promise(function(resolve, reject) {
      let ftp = new FtpClient();
      ftp.connect(conn);
      ftp.on("error", function(err) {
        reject(err);
      });
      ftp.on("ready", () => {
        ftp.put(src, dest, function(err) {
          if (err) return reject(err);
          resolve();
          ftp.end();
        });
      });
    });
  } else if (type == "sftp") {
    let sftp = new SFTPClient();
    return new Promise(function(resolve, reject) {
      sftp
        .connect(conn)
        .then(function() {
          return sftp.put(src, dest);
        })
        .then(() => {
          resolve();
          //   sftp.end();
        })
        .catch(e => {
          reject(e);
          sftp.end();
        });
    });
  } else {
    return new Promise(function(resolve, reject) {
      try {
        var stream;
        stream = fs.createWriteStream(dest);
        src.pipe(stream);
        src.once("close", function() {
        //   console.log("======Done======");
          resolve();
        });
      } catch (e) {
          reject(e)
      }
    });
  }
};
var Transform = require("stream").Transform;

function passThrough() {
  var passthrough = new Transform();
  passthrough._transform = function(data, encoding, done) {
    // console.log(data);
    this.push(data);
    done();
  };
  return passthrough;
}

module.exports = {
  list,
  get,
  put,
  passThrough
};
