let program = require("commander");
function list(val) {
  return val.split(",");
}

program
  .version("2.0.0")
  .usage("[options] <Source FTP/SFTP> <Dest FTP/SFTP>")
  .option(
    "-i, --includes <items>",
    "the List files which you want to include",
    list
  )
  .option(
    "-e, --excludes <items>",
    "the List files which you want to exclude",
    list
  )
  .parse(process.argv);

module.exports = program;
