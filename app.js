// const axios = require('axios')
const { App } = require('@slack/bolt');
require('dotenv').config();

// Initializes your app with your bot token and signing secret
const app = new App({
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	token: process.env.SLACK_BOT_TOKEN,
	socketMode:true,
	appToken: process.env.APP_TOKEN
});

const fs = require('fs');
let raw = fs.readFileSync('db.json');
let faqs = JSON.parse(raw);

app.message("hey", async ({ message, command, say }) => {
	try {
		say(`Yaaay! <@${message.user}> that command works!`);
	} catch (error) {
		console.log("err")
		console.error(error);
	}
});

app.command('/knowledge', async ({ command, ack, say }) => {
	try {
		await ack();
		let message = { blocks: [] };
		faqs.data.map((faq) => {
			message.blocks.push(
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: '*Question ❓*',
					},
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: faq.question,
					},
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: '*Answer ✔️*',
					},
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: faq.answer,
					},
				}
			);
		});
		say(message);
	} catch (error) {
		console.log('err');
		console.error(error);
	}
});

app.command('/ticket', async ({ ack, body, client}) => {
	// Acknowledge the command request
	await ack();

	try {
		// Call views.open with the built-in client
		const result = await client.views.open({
			// Pass a valid trigger_id within 3 seconds of receiving it
			trigger_id: body.trigger_id,
			// View payload
			view: {
				type: 'modal',
				// View identifier
				callback_id: 'view_1',
				title: {
					type: 'plain_text',
					text: 'Modal title'
				},
				blocks: [{
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: 'Welcome to a modal with _blocks_'
						},
						accessory: {
							type: 'button',
							text: {
								type: 'plain_text',
								text: 'Click me!'
							},
							action_id: 'button_abc'
						}
					},
					{
						type: 'input',
						block_id: 'input_c',
						label: {
							type: 'plain_text',
							text: 'What are your hopes and dreams?'
						},
						element: {
							type: 'plain_text_input',
							action_id: 'dreamy_input',
							multiline: true
						}
					}
				],
				submit: {
					type: 'plain_text',
					text: 'Submit'
				}
			}
		});
		console.log(result);
	} catch (error) {
		console.error(error);
	}
});

app.message(/products/, async ({ command, say }) => {
	try {
		let message = { blocks: [] };
		const productsFAQs = faqs.data.filter(
			(faq) => faq.keyword === 'products'
		);

		productsFAQs.map((faq) => {
			message.blocks.push(
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: '*Question ❓*',
					},
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: faq.question,
					},
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: '*Answer ✔️*',
					},
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: faq.answer,
					},
				}
			);
		});

		say(message);
	} catch (error) {
		console.log('err');
		console.error(error);
	}
});

app.command('/update', async ({ command, ack, say }) => {
	try {
		await ack();
		const data = command.text.split('|');

		const newFAQ = {
			keyword: data[0].trim(),
			question: data[1].trim(),
			answer: data[2].trim(),
		};

		// save data to db.json
		fs.readFile('db.json', function (err, data) {
			const json = JSON.parse(data);
			json.data.push(newFAQ);
			fs.writeFile('db.json', JSON.stringify(json), function (err) {
				if (err) throw err;
				console.log('Successfully saved to db.json!');
			});
		});

		say(`You've added a new FAQ with the keyword *${newFAQ.keyword}.*`);
	} catch (error) {
		console.log('err');
		console.error(error);
	}
});

(async () => {
	// Start the app
	await app.start(process.env.PORT || 3000);
	console.log('⚡️ Bolt app is running!');
})();
