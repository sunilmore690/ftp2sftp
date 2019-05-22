#!/usr/bin/env node
const url = require("url");
const myFTP = require("./myftp");
var Multiprogress = require("multi-progress");
var multi = new Multiprogress(process.stderr);
let { includes, excludes, args } = require("./commander");
const aSync = require("async");
const srcURL = args[0];
const destURL = args[1];
// console.log("args", args);
includes = includes || []
excludes = excludes || []
// console.log("includes", includes);
// console.log("excludes", excludes);

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
    srcList = srcList.filter(obj => {
      return obj.type == "-" && validate(obj.name);
    });
    console.log('srcList',srcList)
    destList = destList.filter(obj => obj.type == "-");
    srcList = srcList.filter(file => {
      let a = destList.findIndex(obj => obj.name == file.name);
      a = destList[a];
      if (a && a.size == file.size) {
        console.log(file.name + ` is uptodate`.gray);
        return false;
      }
      return true;
	 });
	//  console.log(srcList.map(file=>file.name));
	//  process.exit(1)
    if (srcList.length == 0) {
      //   console.log("File already in sync");
      process.exit(1);
      //   return;
    }
    aSync.eachOfLimit(
      srcList,
      4,
      async function(file, index, callback) {
        try {
          var bar = multi.newBar(
            "[:bar] " +
              file.name.green +
              " | :percent |ETA: :etas|Time Elapsed: :elapsed s ",
            {
              complete: "=",
              incomplete: " ",
              width: 30,
              total: file.size
            }
          );

          let srcStram = await myFTP.get(
            srcProtocol,
            srcFTP,
            srcPath + file.name
          );
          let uploadedSize = 0;
          srcStram.on("data", function(buffer) {
            var segmentLength = buffer.length;
            bar.tick(segmentLength);
            uploadedSize += segmentLength;
            const per = ((uploadedSize / file.size) * 100).toFixed(2);
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
const validate = function(str) {
  var required = includes;
  var blocked = excludes;
  var lowercaseStr = str.toLowerCase();
  let isAllowed = false;
  let isBlocked = false;
  if (!required.length) {
    isAllowed = true;
  }
  for (var i = 0; i < required.length; i++) {
    let str = required[i].toLowerCase();
    str = str.split("*").join("");
    if (lowercaseStr.indexOf(str) > -1) {
      isAllowed = true;
      if (required[i].startsWith("*") && !required[i].endsWith("*")) {
        if (lowercaseStr.endsWith(str)) isAllowed = true;
        else isAllowed = false;
      }
      if (required[i].endsWith("*") && !!required[i].startsWith("*")) {
        if (lowercaseStr.startsWith(str)) isAllowed = true;
        else isAllowed = false;
      }
    }
  }

  for (let i = 0; i < blocked.length; i++) {
    let str = blocked[i].toLowerCase();
    str = str.split("*").join("");
    if (lowercaseStr.indexOf(str) > -1) {
      isBlocked = true;
      if (blocked[i].startsWith("*") && !blocked[i].endsWith("*")) {
        if (lowercaseStr.endsWith(str)) isBlocked = true;
        else isBlocked = false;
      }
      if (blocked[i].endsWith("*") && !!blocked[i].startsWith("*")) {
        if (lowercaseStr.startsWith(str)) isBlocked = true;
        else isBlocked = false;
      }
    }
  }
  return isAllowed && !isBlocked;
};
process.on("unhandledRejection", function(e) {
  console.log(e);
});
