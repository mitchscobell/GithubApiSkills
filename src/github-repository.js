const fs = require("fs");
const nconf = require("nconf");
const fetch = require("node-fetch");

// import config file
nconf.argv().env().file({ file: "./appconfig.json" });

const apiConfiguration = nconf.get("apiConfiguration");

console.log(apiConfiguration);

/// write some code that will retrieve every pull request
/// for the Ramda organization using the Github web API
/// and store the results in memory
const getPullRequests = function () {
  return "";
};

//TODO abstract away the method calls

// TODO possibly caching results
