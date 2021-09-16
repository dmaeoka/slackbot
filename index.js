const { App } = require("@slack/bolt");
// require('dotenv').config();

// Initializes your app with your bot token and signing secret
const app = new App({
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	token: process.env.SLACK_BOT_TOKEN,
	socketMode: true,
	appToken: process.env.APP_TOKEN,
});

app.message("hey", async ({ message, command, say }) => {
	try {
		say(`Yaaay! <@${message.user}> that command works!`);
	} catch (error) {
		console.error(error);
	}
});
app.message("hello", async ({ message, say }) => {
	// say() sends a message to the channel where the event was triggered
	await say({
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `Hey there <@${message.user}>!`,
				},
				accessory: {
					type: "button",
					text: {
						type: "plain_text",
						text: "Click Me",
					},
					action_id: "button_click",
				},
			},
		],
		text: `Hey there <@${message.user}>!`,
	});
});

app.action("button_click", async ({ body, ack, say }) => {
	// Acknowledge the action
	await ack();
	await say(`<@${body.user.id}> clicked the button`);
});

(async () => {
	// Start the app
	await app.start(process.env.PORT || 3000);
	console.log("⚡️ Bolt app is running!");
})();
