#!/usr/bin/env node
const url = require("url");
const aSync = require("async");
const Multiprogress = require("multi-progress");
require("colors");

const utils = require("./utils");
const { includes = [], excludes = [], args = [] } = require("./libcli");

const srcURL = args[0];
const destURL = args[1];
if (!srcURL) {
  throw new Error("Please Provide srcURL");
}
if (!destURL) {
  throw new Error("Please Provide destURL");
}
var multi = new Multiprogress(process.stderr);

// SOURCE FTP CONNECTION SETTINGS
let {
  hostname: srchostname,
  auth: srcauth,
  port: srcport,
  pathname: srcPath,
  protocol: srcprotocol = ""
} = url.parse(srcURL);

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
  protocol: destprotocol = ""
} = url.parse(destURL);
// console.log("destprotocol", destprotocol);
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
if (srcprotocol) srcprotocol = srcprotocol.replace(":", "");
if (destprotocol) destprotocol = destprotocol.replace(":", "");

async function start() {
  try {
    let srcList = await utils.list(srcprotocol, srcFTP, srcPath);
    //  console.log("srcList", srcList);
    let destList = await utils.list(destprotocol, destFTP, destPath);
    srcList = srcList.filter(obj => {
      return obj.type == "-" && validate(obj.name);
    });

    destList = destList.filter(obj => obj.type == "-");
    //  console.log('dstList',destList)
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
    setTimeout(function() {
      copyFileToFTP(srcList);
    }, 2000);
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
const copyFileToFTP = async function(srcList) {
  let finalList = await utils.list(srcprotocol, srcFTP, srcPath);
  srcList = srcList.filter(file => {
    let a = finalList.findIndex(finalfile => {
      return finalfile.size == file.size;
    });
    if (a > -1) {
      console.log(file.name);
      return true;
    }
    console.log(file.name + ` is not ready`.yellow);
    return false;
  });
  if (srcList.length == 0) {
    console.log("\n===== Done ==========");
    process.exit(1);
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

        let srcStram = await utils.get(
          srcprotocol,
          srcFTP,
          srcPath + file.name
        );

        srcStram.on("data", function(buffer) {
          bar.tick(buffer.length);
        });
        await utils.put(
          destprotocol,
          destFTP,
          destprotocol == "ftp" ||
            (destprotocol == "sftp" && srcprotocol == "ftp") ||
            (destprotocol == "sftp" && srcprotocol == "sftp") ||
            (srcprotocol == "" && destprotocol == "sftp")
            ? srcStram.pipe(utils.passThrough())
            : srcStram,
          destPath + file.name
        );
        if (srcList.length == index + 1) {
          console.log("\n===== Done ==========");
          process.exit(1);
        }
        //   callback()
      } catch (e) {
        callback(e);
      }
    },
    function(e) {}
  );
};
process.on("unhandledRejection", function(e) {
  console.log(e);
});
