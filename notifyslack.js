// *********************** //
// NotifySlack v0.00000001 //
// *********************** //

// to-do: basic front end template for getting setup
// 		  fix issue with marking notifications as seen
//        implement a storage mechanism/make it into an app? requires authentication etc (too far?)

// app settings

var settings = {
	'wp_client_id': '38236',
	'wp_client_secret': 'zBM0kh7xxUZcA6tkPQeSkpUXKGNR9uhpLt2qqUwvEENKijxUhqGA2h4hUxg3KLfw',
	'slack_hook': 'https://hooks.slack.com/services/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',
	'slack_domain': 'a8c',
	'slack_channel': '#scottomattic',
	'oauth_token': 'XDzKH6D^HolU$$lRYvaUAqysYOaGRxD)1W#M#EsZD1NQlcB6IPx#i)*l@uH033SU'
};

// express

var express = require('express'),
app = express();

// set port

app.set('port', (process.env.PORT || 5000));

// slack

var Slack = require('node-slack');
var slack = new Slack(settings.slack_hook);

// cron

var CronJob = require('cron').CronJob;

// oauth settings

var oauth2 = require('simple-oauth2')({
	clientID: settings.wp_client_id,
	clientSecret: settings.wp_client_secret,
	grant_type: 'authorization_code',
	site: 'https://public-api.wordpress.com',
	authorizationPath: '/oauth2/authorize',
	tokenPath: '/oauth2/token'
});

// auth uri definition

var authorization_uri = oauth2.authCode.authorizeURL({
	redirect_uri: 'http://localhost:3000/callback'
});

// boot the app

var server = app.listen(app.get('port'), function () {

	var host = server.address().address
	var port = server.address().port

	console.log('NotifySlack (http://%s:%s)', host, port)
});

// default view

app.get('/', function (req, res) {
	console.log('/');
	if (settings.oauth_token == '') {
		res.send('NotifySlack App - <a href="/auth">Grab your oAuth token</a>.');
	} else {
		res.send('NotifySlack App');
	}
});

// redirect to /auth with WordPress.com to get token

app.get('/auth', function (req, res) {

	// once an auth key is set bail
	if (settings.oauth_token != '')
		res.redirect('/'); return;

	console.log(authorization_uri);
	res.redirect(authorization_uri);
});

// callback service parsing the authorisation token and asking for the access token

app.get('/callback', function (req, res) {

	// once an auth key is set bail
	if (settings.oauth_token != '')
		res.redirect('/'); return;

	var code = req.query.code;
	console.log('/callback');
	oauth2.authCode.getToken({
		code: code,
		redirect_uri: 'http://localhost:3000/callback'
	}, saveToken);

	function saveToken(error, result) {
		if (error) { console.log('Access Token Error', error.message); }
			token = oauth2.accessToken.create(result);
			console.log(token);
			res.redirect('/')
	}
});

// run the sweep every minute when a token is set

new CronJob('0 * * * * *', function() {

	if (settings.oauth_token == '' )
		return;

	console.log('Running NotifySlack...');

	var rest = require('restler');

	var options = {
		accessToken: settings.oauth_token
	};

	rest.get('https://public-api.wordpress.com/rest/v1/notifications/?unread=true', options).on('complete', function(result, response) {

		if (result instanceof Error) {

			console.log('Error:', result.message);

		} else {

			var counts = {};
			var ent = require('ent');

		 	result.notes.forEach(function(note) {

				console.log('Sending ' + note.id + ' to Slack.');

				switch(note.type) {

					case "like_milestone_achievement":

						var text = ent.decode(note.subject.text);
						var title = 'WordPress.com: ' + ent.decode(note.body.header_text);

						break;

					default:

						var text =  '<'+ note.body.header_link +'|'+ ent.decode(note.subject.text) +' »>';
						var title = 'WordPress.com: ' + ent.decode(note.body.header_text);
				}

				// send to slack
				slack.send({
					text: text,
					channel: settings.slack_channel,
					username: title,
					icon_url: note.subject.icon,
					unfurl_links: true,
					link_names: 1
				});

				// add to array mark as read
				counts[note.id] = 1;

			});

			// mark these as read
			// console.log(counts);

			if (Object.keys(counts).length) {

				var postoptions = {
					data: {
						counts: counts
					},
					accessToken: settings.oauth_token
				};

				rest.post('https://public-api.wordpress.com/rest/v1/notifications/read', postoptions).on('complete', function(postresult, postresponse) {

					if (postresult instanceof Error) {

						console.log('Error:', postresult.message);

					} else {

						console.log(Object.keys(counts).length + ' notifications marked as read.');
						console.log(postresult);
					}
				});
			} else {
				console.log('No new notifications.')
			}
		}
	});
}, null, true);

// keep alive on heroku
var http = require('http');

function keepalive() {
	setInterval(function() {
		var options = {
			host: 'notifyslack.herokuapp.com',
			port: 80,
			path: '/'
		};
		http.get(options, function(res) {
			res.on('data', function(chunk) {
				try {
					// optional logging... disable after it's working
					console.log("HEROKU Ping: " + chunk);
				} catch (err) {
					console.log(err.message);
				}
			});
		}).on('error', function(err) {
			console.log("Error: " + err.message);
		});
	}, 20 * 60 * 1000); // load every 20 minutes
}

keepalive();
