# NotifySlack

This small node.js app will send your personal WordPress.com notifications to a Slack room.

To get setup you will need:

- To register a [WordPress.com App](https://developer.wordpress.com/apps/)
- Create a custom Slack Hook

## Setup the App

Browse to the directory in your terminal app and run: `npm install`.

## Register a WordPress.com App

Visit the [WordPress.com Developer site](https://developer.wordpress.com/apps/) and register a new app. Set the redirect URI to `http://localhost:3000` and leave the JavaScript origins section blank. The rest of the information can be personalised to your own requirements.

Once setup make a note of the `Client ID` and `Client Secret` and add those to the settings array at the top of `notifyslack.js`.

You can now obtain your oAuth token. Launch the app:

`node notifyslack.js`

and browse to:

`localhost:3000`

Follow the instructions on screen and keep an eye on your terminal. Once you have approved the app you will see your oAuth token in your terminal:

```
{ create: [Function: create],
	token:
	{ access_token: 'YOUR SECRET',
	token_type: 'bearer',
	blog_id: '0000000000',
	blog_url: 'http://site.wordpress.com',
	scope: '',
	expires_at: Wed Dec 17 2014 09:54:36 GMT+0000 (GMT) },
	expired: [Function: expired],
	refresh: [Function: refresh],
	revoke: [Function: revoke]
}
```

Copy your access token and add it to the settings array at the top of `notifyslack.js`.

## Create a custom Slack hook

Visit the [Slack website](https://slack.com/services/new/incoming-webhook) and create your custom webhook. Then add the URL to the settings array at the top of `notifyslack.js`. You can also add your `slack_channel` (the room you wish to post to) and `slack_domain` (your company wide domain for your Slack account e.g: `wordpress`).

## Set it Running

Quit the node app with `CTRL-C` and then set it running again: `node notifyslack.js`.

You should now see the following in your terminal.

```
NotifySlack (http://0.0.0.0:3000)
Running NotifySlack...
No new notifications.
```

The app will check for new notifications every minute and post them to your Slack room.

## Heroku

The Heroku branch is for if you want to deploy the app online. You will need to move your app settings into [config variables](https://devcenter.heroku.com/articles/config-vars) and then deploy the app using:

```
git push heroku heroku:master
```

Heroku have a great [getting started](https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction) guide to help you get setup.


## Bugs

At the moment the app does not correctly set the messages as seen. This is being worked on.
