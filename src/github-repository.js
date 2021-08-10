const fs = require("fs");
const nconf = require("nconf");
const fetch = require("node-fetch");

// import config file
nconf.argv().env().file({ file: "./appconfig.json" });
const apiConfiguration = nconf.get("apiConfiguration");

let getQuery = function (typeOfQuery) {
  return `
  query {
    repository(
      owner:"${apiConfiguration.owner}", 
      name:"${apiConfiguration.name}") {
        ${typeOfQuery}
    }
  }`;
};

/// write some code that will retrieve every pull request
/// for the Ramda organization using the Github web API
/// and store the results in memory
const getPullRequests = function () {
  // query for pulling info
  const typeOfQuery = `
  pullRequests {
    totalCount
  }
  `;

  const query = getQuery(typeOfQuery);

  fetch("https://api.github.com/graphql", {
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

module.exports = getPullRequests;

// TODO abstract away the method calls

// TODO possibly caching results
