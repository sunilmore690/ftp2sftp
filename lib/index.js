#!/usr/bin/env node
const url = require("url");
const myFTP = require("./myftp");
const _cliProgress = require("cli-progress");
const aSync = require("async");
const srcURL = process.argv[2];
const destURL = process.argv[3];
let bar = {};
if (!srcURL) {
  throw new Error("Please Provide srcURL");
}
if (!destURL) {
  throw new Error("Please Provide destURL");
}
require("colors");

// SOURCE FTP CONNECTION SETTINGS
let {
  hostname: srchostname,
  auth: srcauth,
  port: srcport,
  pathname: srcPath,
  protocol: srcprotocol
} = url.parse(srcURL);
// console.log('SRC',url.parse(srcURL))
const srcUsername = srcauth ? srcauth.split(":")[0] : "";
const srcPassword = srcauth ? srcauth.split(":")[1] : "";

const srcFTP = {
  host: srchostname || "localhost",
  port: srcport || srcprotocol == "ftp:" ? 21 : 22,
  username: srcUsername,
  user: srcUsername,
  password: srcPassword
};

let {
  hostname: desthostname,
  auth: destauth,
  port: destport,
  pathname: destPath,
  protocol: destprotocol
} = url.parse(destURL);
srcPath =
  srcPath.lastIndexOf("/") != srcPath.length - 1 ? srcPath + "/" : srcPath;
destPath =
  destPath.lastIndexOf("/") != destPath.length - 1 ? destPath + "/" : destPath;
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

async function start() {
  try {
    let srcList = await myFTP.list(srcProtocol, srcFTP, srcPath);
    let destList = await myFTP.list(destProtocol, destFTP, destPath);
    srcList = srcList.filter(obj => obj.type == "-");
    destList = destList.filter(obj => obj.type == "-");
    srcList = srcList.filter(file => {
      let a = destList.findIndex(obj => obj.name == file.name);
      a = destList[a];
      if (a && a.size == file.size) {
        console.log(file.name + ` already upto date`.gray);
        return false;
      }
      return true;
    });
    if (srcList.length == 0) {
      //   console.log("File already in sync");
      process.exit(1);
      //   return;
    }
    aSync.eachOfLimit(
      srcList,
      1,
      async function(file, index, callback) {
        try {
          bar[index] = new _cliProgress.Bar(
            {
              format:  "[{bar}] |"+file.name.green +" |  {percentage}% | ETA: {eta_formatted}"
            },
            _cliProgress.Presets.shades_classic
          );
          bar[index].start(100, 0);

          let srcStram = await myFTP.get(
            srcProtocol,
            srcFTP,
            srcPath + file.name
          );
          let uploadedSize = 0;
          srcStram.on("data", function(buffer) {
            var segmentLength = buffer.length;
            uploadedSize += segmentLength;
            const per = ((uploadedSize / file.size) * 100).toFixed(2);
            // console.log('index',index)
            bar[index].update(per);
          });
          srcStram.once("close", function() {
            bar[index].stop();
          });
          await myFTP.put(
            destProtocol,
            destFTP,
            destProtocol == "ftp" ||
              (destProtocol == "sftp" && srcProtocol == "ftp") ||
              (destProtocol == "sftp" && srcProtocol == "sftp")
              ? srcStram.pipe(myFTP.passThrough())
              : srcStram,
            destPath + file.name
          );
          if (srcList.length == index + 1) {
            console.log("==Done===");
            process.exit(1);
          }
          //   callback()
        } catch (e) {
          callback(e);
        }
      },
      function(e) {}
    );
  } catch (e) {
    throw new Error(e);
  }
}
start();
process.on("unhandledRejection", function(e) {
  console.log(e);
});
