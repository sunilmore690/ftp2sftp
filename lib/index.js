#!/usr/bin/env node
const url = require("url");
const myFTP = require("./myftp");
const _cliProgress = require("cli-progress");
// const colors = require("colors");
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
const srcURL = process.argv[2];
const destURL = process.argv[3];
if (!srcURL) {
  throw new Error("Please Provide srcURL");
}
if (!destURL) {
  throw new Error("Please Provide destURL");
}
var colors = require("colors");

// SOURCE FTP CONNECTION SETTINGS
const {
  hostname: srchostname,
  auth: srcauth,
  port: srcport,
  pathname: srcPath,
  protocol: srcprotocol
} = url.parse(srcURL);
// console.log('SRC',url.parse(srcURL))
const srcUsername = srcauth ? srcauth.split(":")[0] : "";
const srcPassword = srcauth ? srcauth.split(":")[1] : "";
console.log("srcprotocol", srcprotocol);
const srcFTP = {
  host: srchostname || "localhost",
  port: srcport || srcprotocol == "ftp:" ? 21 : 22,
  username: srcUsername,
  user: srcUsername,
  password: srcPassword
};

const {
  hostname: desthostname,
  auth: destauth,
  port: destport,
  pathname: destPath,
  protocol: destprotocol
} = url.parse(destURL);
// console.log("destprotocol", destprotocol);
// DESTINATION FTP CONNECTION SETTINGS
const destUsername = destauth ? destauth.split(":")[0] : "";
const destPassword = destauth ? destauth.split(":")[1] : "";
const destFTP = {
  host: desthostname || "locahost",
  port: destport || destprotocol == "ftp:" ? 21 : 22,
  user: destUsername,
  username: destUsername,
  password: destPassword
};
srcProtocol = srcprotocol.replace(":", "");
destProtocol = destprotocol.replace(":", "");
// console.log("srcFTP", srcFTP);
// console.log("destFTP", destFTP);
// console.log("srcPath", srcPath);
// console.log("destPath", destPath);
async function start() {
  try {
    let srcList = await myFTP.list(srcProtocol, srcFTP, srcPath);
    let destList = await myFTP.list(destProtocol, destFTP, destPath);
    srcList = srcList.filter(obj => obj.type == "-");
    destList = destList.filter(obj => obj.type == "-");
    srcList = srcList.filter(file => {
      let a = destList.findIndex((obj)=>  obj.name == file.name );
      a = destList[a];
      if (a && a.size == file.size) return false;
      return true;
    });
    if (srcList.length == 0) {
      console.log("File already in sync");
      return;
    }
    srcList.map(async function(file, index) {
      let srcStram = await myFTP.get(srcProtocol, srcFTP, srcPath + file.name);
      let uploadedSize = 0;
      let barprogress = new _cliProgress.Bar(
        { format: file.name + "[{bar}] {percentage}% | ETA: {eta}s" },
        _cliProgress.Presets.shades_classic
      );
      barprogress.start(100, 0);
      srcStram.on("data", function(buffer) {
        var segmentLength = buffer.length;
        uploadedSize += segmentLength;
        const per = ((uploadedSize / file.size) * 100).toFixed(2);
        barprogress.update(per);
      });
      srcStram.once("close", function() {
        barprogress.stop();
        // if (srcList.length === index + 1) process.exit(1);
      });
      await myFTP.put(destProtocol, destFTP, srcStram, destPath + file.name);
      // if (srcList.length === index + 1) process.exit(1);
    });
  } catch (e) {
    throw new Error(e);
  }
}
start();
