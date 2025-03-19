const sqlite3 = require("sqlite3").verbose();
const atproto = require("@atproto/api");
const { XMLParser } = require("fast-xml-parser");
const text = require("node:stream/consumers").text;

const db = new sqlite3.Database("data/rss.db");
const bskyagent = new atproto.AtpAgent({
  service: "https://bsky.social",
});

const createTableSql = `
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guid TEXT NOT NULL,
        title TEXT NOT NULL,
        link TEXT UNIQUE NOT NULL,
        contentSnippet TEXT NOT NULL
    )`;

db.run(createTableSql, (err) => {
  if (err) {
    return console.error("Error creating table:", err.message);
  }
  console.log("Table created successfully");
});

var item = {};
const xmlParseOptions = {
  ignoreAttributes: false,
  tagValueProcessor: (tagName, tagValue) => {
    if (tagName == "title") {
      item.title = tagValue;
    } else if (tagName == "link") {
      item.link = tagValue;
    } else if (tagName == "guid") {
      item.guid = tagValue;
      processItem({ ...item });
      item = {};
    }

    return tagValue;
  },
};

console.log(new Date().toString());

bskyagent.login({
  identifier: process.env.BLUESKY_USERNAME,
  password: process.env.BLUESKY_PASSWORD,
});

var item = {};
fetch("https://zenit.org/feed/").then((response) => {
  text(response.body).then((body) => {
    new XMLParser(xmlParseOptions).parse(body);
  });
});

function processItem(feedItem) {
  // First, check if the item with the specific guid exists
  db.get("SELECT * FROM items WHERE guid = ?", [feedItem.guid], (err, row) => {
    if (err) {
      console.error("Error checking item:", err);
      return;
    }

    if (row) {
      console.log(`Item with GUID ${feedItem.guid} already exists.`);
    } else {
      post(feedItem);

      // If the item doesn't exist, insert a new item
      const insertQuery =
        "INSERT INTO items (guid, title, link, contentSnippet) VALUES (?, ?, ?, ?)";

      db.run(
        insertQuery,
        [feedItem.guid, feedItem.title, feedItem.link, " "],
        function (err) {
          if (err) {
            console.error("Error inserting item:", err);
          } else {
            console.log(
              `Item with GUID ${feedItem.guid} inserted successfully.`
            );
          }
        }
      );
    }
  });
}

function post(feedItem) {
  const rt = new atproto.RichText({
    text: `${feedItem.title.substring(
      0,
      299 - feedItem.link.length - 7
    )} [...] ${feedItem.link}`,
  });

  rt.detectFacets(bskyagent); // automatically detects mentions and links
  const postRecord = {
    $type: "app.bsky.feed.post",
    text: rt.text,
    facets: rt.facets,
    createdAt: new Date().toISOString(),
  };
  bskyagent.post(postRecord);
}
