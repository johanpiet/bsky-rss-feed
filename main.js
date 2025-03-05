const RssParser = require("rss-parser");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("rss.db");

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

// Create a new RSS parser instance
const parser = new RssParser();

// Fetch and parse the RSS feed
parser.parseURL("https://zenit.org/feed/").then((feed) => {
  // Loop through the items in the feed
  feed.items.forEach((item) => {
    console.log(item);
    process(item);
  });
});

function process(item) {
  // First, check if the item with the specific guid exists
  db.get("SELECT * FROM items WHERE guid = ?", [item.guid], (err, row) => {
    if (err) {
      console.error("Error checking item:", err);
      return;
    }

    if (row) {
      console.log(`Item with GUID ${item.guid} already exists.`);
    } else {
      // If the item doesn't exist, insert a new item
      const insertQuery =
        "INSERT INTO items (guid, title, link, contentSnippet) VALUES (?, ?, ?, ?)";

      db.run(
        insertQuery,
        [item.guid, item.title, item.link, item.contentSnippet],
        function (err) {
          if (err) {
            console.error("Error inserting item:", err);
          } else {
            console.log(`Item with GUID ${item.guid} inserted successfully.`);
          }
        }
      );
    }
  });
}
