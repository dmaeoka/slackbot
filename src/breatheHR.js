const axios = require("axios");
const objectToQueryString = require("./uri");
const BREATHE_TOKEN = Buffer.from(process.env.KEY_4, 'base64').toString('ascii');

class Breathe {
	constructor() {
		this.token = BREATHE_TOKEN;
	}

	urlParams(parameters = {}) {
		if (Object.values(parameters).length > 0) {
			return "?" + objectToQueryString(parameters);
		}
		return;
	}

	execute(method = "GET", endpoint, parameters = "") {
		try {
			let url = this.token.includes("sandbox") ? 'https://api.sandbox.breathehr.info' : `https://api.breathehr.com`;
			url += `/v1/${endpoint}${parameters}`;

			return axios({
				url,
				method,
				headers: {
					"X-API-KEY": this.token,
					"Content-Type": "application/json",
				},
			});
		} catch (error) {
			console.warn(error);
		}
	}

	async get(page = 1, per_page = 100) {
		const query_string = this.urlParams({
			page,
			per_page,
		});
		const response = await this.execute("GET", this.endpoint, query_string);
		return response.data[this.endpoint] || [];
	}
}

class Employees extends Breathe {
	constructor(id) {
		super();
		this.endpoint = "employees";
		this.id = id;
	}

	async get(page = 1, per_page = 100, filter = null) {
		const query_string = this.urlParams({
			page,
			per_page,
		});
		let response;
		if (this.id) {
			response = await this.execute("GET", this.endpoint, `/${this.id}`);
			return response.data[this.endpoint][0] || [];
		}

		response = await this.execute("GET", this.endpoint, query_string);
		return response.data[this.endpoint] || [];
	}

	async leaveRequests(
		exclude_cancelled_absences = true,
		page = 1,
		per_page = 100
	) {
		const query_string = this.urlParams({
			exclude_cancelled_absences,
			page,
			per_page,
		});
		const response = await this.execute(
			"GET",
			this.endpoint,
			`/${this.id}/leave_requests${query_string}`
		);
		return response.data["leave_requests"] || [];
	}

	async createLeaveRequests(params = {}) {
		const query_string = this.urlParams({
			id: this.id,
			leave_request: params,
		});
		const response = await this.execute(
			"POST",
			this.endpoint,
			`/${this.id}/leave_requests${query_string}`
		);
		return response.data["leave_requests"] || [];
	}

	async sicknesses() {
		const query_string = this.urlParams({
			id: this.id,
		});
		const response = await this.execute(
			"GET",
			this.endpoint,
			`/${this.id}/sicknesses${query_string}`
		);
		return response.data["sicknesses"] || [];
	}

	async createSickness(params = {}) {
		const query_string = this.urlParams({
			id: this.id,
			sickness: params,
		});
		const response = await this.execute(
			"POST",
			this.endpoint,
			`/${this.id}/sicknesses${query_string}`
		);
		return response.data["sicknesses"] || [];
	}
}

class EmployeeTrainingCourses extends Breathe {
	constructor() {
		super();
		this.endpoint = "employee_training_courses";
	}
}

class HolidayAllowances extends Breathe {
	constructor() {
		super();
		this.endpoint = "holiday_allowances";
	}
}

class LeaveRequests extends Breathe {
	constructor(id) {
		super();
		this.endpoint = "leave_requests";
		this.id = id;
	}

	async get(page = 1, per_page = 100, parameters = {}) {
		const defaultParameters = Object.assign(parameters, {
			page,
			per_page,
		});
		const query_string = this.urlParams(defaultParameters);
		const response = await this.execute("GET", this.endpoint, query_string);
		return response.data[this.endpoint] || [];
	}

	async cancelling() {
		const response = await this.execute(
			"GET",
			this.endpoint,
			`/${this.id}/cancelling`
		);
		return response.data[this.endpoint] || [];
	}

	async otherLeaveReasons() {
		const response = await this.execute(
			"GET",
			this.endpoint,
			`/${this.id}/other_leave_reasons`
		);
		return response.data["other_leave_reasons"] || [];
	}
}

class Locations extends Breathe {
	constructor() {
		super();
		this.endpoint = "locations";
	}
}

class OtherLeaveReasons extends Breathe {
	constructor() {
		super();
		this.endpoint = "other_leave_reasons";
	}
}

class Sicknesses extends Breathe {
	constructor(id) {
		super();
		this.endpoint = "sicknesses";
	}
}

module.exports = {
	Employees,
	Sicknesses,
};
