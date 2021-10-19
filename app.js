const { App, AwsLambdaReceiver } = require("@slack/bolt");
const axios = require("axios");
const { Employees, Sicknesses } = require("./src/breatheHR");
const botURL = "https://hooks.slack.com/services/" + process.env.SLACK_WEBHOOK;
const awsLambdaReceiver = new AwsLambdaReceiver({
	signingSecret: process.env.SLACK_SIGNING_SECRET
});

// Initializes your app with your bot token and the AWS Lambda ready receiver
const app = new App({
	token: process.env.SLACK_BOT_TOKEN,
	appToken: process.env.SLACK_APP_TOKEN,
	receiver: awsLambdaReceiver,
	processBeforeResponse: true,
});

app.shortcut("sickness", async ({ shortcut, body, ack, client }) => {
	await ack();
	const info = await client.users.info({
		user: shortcut.user.id,
	});
	const today = (() => {
		const d = new Date();
		if (d.getHours() > 17) {
			d.setDate(d.getDate() + 1);
		}
		return d.toISOString().substr(0, 10);
	})();
	await client.views.open({
		trigger_id: body.trigger_id,
		view: {
			type: "modal",
			callback_id: "sickness-modal",
			submit: {
				type: "plain_text",
				text: "Submit",
				emoji: true,
			},
			close: {
				type: "plain_text",
				text: "Cancel",
				emoji: true,
			},
			title: {
				type: "plain_text",
				text: "Report sickness",
				emoji: true,
			},
			blocks: [
				{
					type: "section",
					text: {
						type: "plain_text",
						text: `:wave: Hey ${info.user.real_name} !\nWe're sorry to hear you are not feeling great today! We wish you a speedy recovery!`,
						emoji: true,
					},
				},
				{
					type: "divider",
				},
				{
					type: "input",
					element: {
						type: "datepicker",
						initial_date: today,
						placeholder: {
							type: "plain_text",
							text: "Select a date",
							emoji: true,
						},
						action_id: "start_date-action",
					},
					label: {
						type: "plain_text",
						text: "Start date",
						emoji: true,
					},
				},
				{
					type: "divider",
				},
				{
					type: "input",
					optional: true,
					element: {
						type: "datepicker",
						initial_date: today,
						placeholder: {
							type: "plain_text",
							text: "Select a date",
							emoji: true,
						},
						action_id: "end_date-action",
					},
					label: {
						type: "plain_text",
						text: "End date",
						emoji: true,
					},
				},
				{
					type: "input",
					element: {
						type: "static_select",
						placeholder: {
							type: "plain_text",
							text: "Select an item",
							emoji: true,
						},
						options: [
							{
								text: {
									type: "plain_text",
									text: "Cough, Cold, Flu",
									emoji: true,
								},
								value: "364545",
							},
							{
								text: {
									type: "plain_text",
									text: "Digestive / Stomach",
									emoji: true,
								},
								value: "364544",
							},
							{
								text: {
									type: "plain_text",
									text: "Headache / migraine",
									emoji: true,
								},
								value: "364543",
							},
							{
								text: {
									type: "plain_text",
									text: "Non-work related injury",
									emoji: true,
								},
								value: "364548",
							},
							{
								text: {
									type: "plain_text",
									text: "Other",
									emoji: true,
								},
								value: "364549",
							},
							{
								text: {
									type: "plain_text",
									text: "Psychiatric / Stress",
									emoji: true,
								},
								value: "364546",
							},
							{
								text: {
									type: "plain_text",
									text: "Work Related Injury",
									emoji: true,
								},
								value: "364547",
							},
						],
						action_id: "sickness_type-action",
					},
					label: {
						type: "plain_text",
						text: "Sickness type",
						emoji: true,
					},
				},
				{
					type: "input",
					optional: true,
					element: {
						type: "plain_text_input",
						multiline: true,
						action_id: "reason-action",
					},
					label: {
						type: "plain_text",
						text: "Additional details",
						emoji: true,
					},
				},
			],
		},
	});
});

app.view("sickness-modal", async ({ ack, body, context, client }) => {
	try {
		await ack();
		const { values } = body.view.state;
		const answer = Object.values(values);
		const info = await client.users.info({
			user: body.user.id,
		});
		const users = await new Employees().get();
		const currentUser = users.filter((item) => item.email == info.user.profile.email)[0];
		const currentEmployee = new Employees(currentUser.id);
		const start_date = answer[0]["start_date-action"]["selected_date"].split("-").reverse().join("/");
		const end_date = (() => {
			let date_1 = new Date(answer[0]["start_date-action"]["selected_date"]);
			let date_2 = answer[1]["end_date-action"]["selected_date"];
			if (date_2) {
				date_2 = new Date(date_2);
				if (date_2.getTime() - date_1.getTime() > 0) {
					return date_2.toLocaleDateString();
				} else {
					return date_1.toLocaleDateString();
				}
			}
			return null;
		})();
		const sicknesstype_id = answer[2]["sickness_type-action"]["selected_option"].value;
		const reason = answer[3]["reason-action"].value;
		const params = {
			start_date: start_date,
			half_start_am_pm: "am",
			end_date: end_date,
			company_sicknesstype_id: sicknesstype_id,
			reason: reason,
		};
		let text;
		try {
			const results = await currentEmployee.createSickness(params);
			text = "Wish you a speedy recovery! See you soon!";
		} catch (error) {
			text = "Something went wrong with the BreatheHR API, please check try on the website ";
		}

		axios({
			url: botURL,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			data: {
				text: text
			},
		});
	} catch (error) {
		console.warn(error);
	}
});

app.shortcut("leave", async ({ shortcut, body, ack, client }) => {
	await ack();
	const info = await client.users.info({
		user: shortcut.user.id,
	});
	const today = (() => {
		const d = new Date();
		if (d.getHours() > 17) {
			d.setDate(d.getDate() + 1);
		}
		return d.toISOString().substr(0, 10);
	})();

	await client.views.open({
		trigger_id: body.trigger_id,
		view: {
			type: "modal",
			callback_id: "leave-modal",
			submit: {
				type: "plain_text",
				text: "Submit",
				emoji: true,
			},
			close: {
				type: "plain_text",
				text: "Cancel",
				emoji: true,
			},
			title: {
				type: "plain_text",
				text: "Add leave request",
				emoji: true,
			},
			blocks: [
				{
					type: "section",
					text: {
						type: "plain_text",
						text: `Hey ${info.user.real_name}! Are you going on holidays?`,
						emoji: true,
					},
				},
				{
					type: "divider",
				},
				{
					type: "input",
					element: {
						type: "datepicker",
						initial_date: today,
						placeholder: {
							type: "plain_text",
							text: "Select a date",
							emoji: true,
						},
						action_id: "start_date-action",
					},
					label: {
						type: "plain_text",
						text: "Start Date",
						emoji: true,
					},
				},
				{
					type: "divider",
				},
				{
					type: "input",
					optional: true,
					element: {
						type: "datepicker",
						initial_date: today,
						placeholder: {
							type: "plain_text",
							text: "Select a date",
							emoji: true,
						},
						action_id: "end_date-action",
					},
					label: {
						type: "plain_text",
						text: "End date",
						emoji: true,
					},
				},
				{
					type: "context",
					elements: [
						{
							type: "plain_text",
							text: "You can leave the end date blank if taking a day",
						},
					],
				},
				{
					type: "input",
					optional: true,
					element: {
						type: "plain_text_input",
						multiline: true,
						action_id: "notes-action",
					},
					label: {
						type: "plain_text",
						text: "Notes",
						emoji: true,
					},
				},
			],
		},
	});
});

app.view("leave-modal", async ({ ack, body, context, client }) => {
	try {
		await ack();
		const { values } = body.view.state;
		const answer = Object.values(values);
		const info = await client.users.info({
			user: body.user.id,
		});
		const users = await new Employees().get();
		const currentUser = users.filter((item) => item.email == info.user.profile.email)[0];
		const currentEmployee = new Employees(currentUser.id);
		const start_date = answer[0]["start_date-action"]["selected_date"].split("-").reverse().join("/");
		const end_date = (() => {
			let date_1 = new Date(answer[0]["start_date-action"]["selected_date"]);
			let date_2 = answer[1]["end_date-action"]["selected_date"];
			if (date_2) {
				date_2 = new Date(date_2);
				if (date_2.getTime() - date_1.getTime() > 0) {
					return date_2.toLocaleDateString();
				}
			}
			return start_date;
		})();
		const params = {
			start_date: start_date,
			end_date: end_date,
			half_start_am_pm: null,
			half_end_am_pm: null,
			type: "Holiday",
			notes: answer[2]["notes-action"].value,
		};
		let text;
		try {
			const results = await currentEmployee.createLeaveRequests(params);
			text = `You have sucesfully booked a leave from ${start_date} to ${end_date}.`;
		} catch (error) {
			text = "Booking non authorized via API, please check on BreatheHR";
		}

		axios({
			url: botURL,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			data: {
				text: text,
			},
		});
		return null;
	} catch (error) {
		console.warn(error);
	}
});

app.event("app_home_opened", async ({ event, client }) => {
	await client.views.publish({
		user_id: event.user,
		view: {
			type: "home",
			blocks: [
				{
					type: "section",
					block_id: "section678",
					text: {
						type: "mrkdwn",
						text: "App Home Published",
					},
				},
			],
		},
	});
});

// Handle the Lambda function event
module.exports.slack = async (event, context, callback) => {
	const handler = await awsLambdaReceiver.start();
	return handler(event, context, callback);
};
