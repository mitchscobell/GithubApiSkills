const fs = require("fs");
const nconf = require("nconf");
const fetch = require("node-fetch");

// import config file
nconf.argv().env().file({ file: "./appconfig.json" });
const apiConfiguration = nconf.get("apiConfiguration");

const getAllRepositoriesForOwner = function () {
  // query for pulling info
  const query = `
  query {
    repository(
      owner:"${apiConfiguration.owner}", 
      name:"${apiConfiguration.name}") {
      pullRequests {
        totalCount
      }
    }
  }
  `;

  fetch(apiConfiguration.url, {
    method: "POST",
    body: JSON.stringify({ query }),
    headers: {
      Authorization: `Bearer ${apiConfiguration.accessToken}`,
    },
  })
    .then((res) => res.text())
    .then((body) => console.log(body)) // {"data":{"repository":{"issues":{"totalCount":247}}}}
    .catch((error) => console.error(error));
};

/// write some code that will retrieve every pull request
/// for the Ramda organization using the Github web API
/// and store the results in memory
const getPullRequests = function () {
  // query for pulling info
  const query = `
  query {
    repository(
      owner:"${apiConfiguration.owner}", 
      name:"${apiConfiguration.name}") {
      pullRequests {
        totalCount
      }
    }
  }
  `;

  fetch(apiConfiguration.url, {
    method: "POST",
    body: JSON.stringify({ query }),
    headers: {
      Authorization: `Bearer ${apiConfiguration.accessToken}`,
    },
  })
    .then((res) => res.text())
    .then((body) => console.log(body)) // {"data":{"repository":{"issues":{"totalCount":247}}}}
    .catch((error) => console.error(error));
};

module.exports = {
  getPullRequests: getPullRequests(),
  getAllRepositoriesForOwner: getAllRepositoriesForOwner(),
};

// TODO abstract away the method calls

// TODO possibly caching results
