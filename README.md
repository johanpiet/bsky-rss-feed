# bsky-rss-feed
Reed an RSS-feed (at the moment only ZENIT.org) and post the latest items to Bluesky.

It will create a local db to check for double posts.

## Run
To run, create a .env file with the following entries (or set the corresponding environment variables):
BLUESKY_USERNAME=<username for bluesky, typically an email-address>
BLUESKY_PASSWORD=<password for the user to login to bluesky>

Run with:
`node --env-file=.env main.js`

To schedule it, you can create a cron job or do it manual (e.g. with a `watch -n 60` to schedule every minute).
