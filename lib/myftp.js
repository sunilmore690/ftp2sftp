const FtpClient = require("ftp");
const SFTPClient = require("ssh2-sftp-client");
const list = function(type, conn, dir) {
  type = type || "ftp";
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
  } else {
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
  }
};
const get = function(type, conn, file, cb) {
  type = type || "ftp";
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
  } else {
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
  }
};
const put = function(type, conn, src, dest) {
  type = type || "ftp";
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
  } else {
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
