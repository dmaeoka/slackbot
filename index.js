const { App } = require('@slack/bolt');
// require('dotenv').config();

// Initializes your app with your bot token and signing secret
const app = new App({
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	token: process.env.SLACK_BOT_TOKEN,
	socketMode:true,
	appToken: process.env.APP_TOKEN
});

app.message("hey", async ({ message, command, say }) => {
	try {
		say(`Yaaay! <@${message.user}> that command works!`);
	} catch (error) {
		console.log("err")
		console.error(error);
	}
});

(async () => {
	// Start the app
	await app.start(process.env.PORT || 3000);
	console.log('⚡️ Bolt app is running!');
})();
