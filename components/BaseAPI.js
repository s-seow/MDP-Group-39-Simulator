
export class CustomError extends Error {
	content;

	constructor(content) {
		super();
		this.content = content
	}

	msg(s) {
		this.message = s;
	}
}

export var methodType = {get : 'GET', post : 'POST', put : 'PUT', delete : 'DELETE'};

export default class BaseAPI {	
	static JSONRequest(api, method, headers, options, content) {
		// const host = "https://mdpapi.kyaw.tech/";
		// IP of the algorithm server
		const host = "http://localhost:5000/";

		let requestOptions = {
			method: method,
			headers: {...headers, 'Content-Type': 'application/json'},
			...options
		}

		if (method === methodType.post || method === methodType.put) {
			requestOptions.body = JSON.stringify(content)
		}

		return new Promise((resolve, reject) => {
			fetch(host + api, requestOptions)
				.then(response => {
					if (!response.ok) {
						throw new CustomError(response);
					}

					response.json()
						.then(res => {
							if (res.error) {
								reject(JSON.stringify(res.error));
							}
							resolve(res.data);
						})
						.catch(err => {
							resolve({});
						});

				})
				.catch(async (err) => {
					console.log(err)
					if (err instanceof CustomError) {

						// best effort to capture all cases of err handling
						let errStr = await err.content.json()
							.then(res => {
								if (res.errors) {
									return JSON.stringify(res.errors);
								}

								return "";
							}).catch(() => {
								return "";
							});

						err.msg(errStr);
						reject(err);

					} else {
						reject(err);
					}
				})
		})
	}
}



// edit

// export class CustomError extends Error {
//   content;
//   constructor(content, message = "Request failed") {
//     super(message);
//     this.name = "CustomError";
//     this.content = content;
//   }
// }

// export const methodType = { get: "GET", post: "POST", put: "PUT", delete: "DELETE" };

// export default class BaseAPI {
//   static get host() {
//     // Allow overriding via env; default to local Flask API
//     const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/";
//     return base.endsWith("/") ? base : base + "/";
//   }

//   static async parseResponseJSON(response) {
//     // Gracefully handle empty/invalid JSON bodies
//     const text = await response.text();
//     if (!text) return {};
//     try {
//       return JSON.parse(text);
//     } catch {
//       // Some endpoints may return raw text; surface it as {data:text}
//       return { data: text };
//     }
//   }

//   static async JSONRequest(api, method, headers = {}, options = {}, content = undefined) {
//     const requestOptions = {
//       method,
//       headers: { "Content-Type": "application/json", ...headers },
//       ...options,
//     };
//     if (method === methodType.post || method === methodType.put) {
//       requestOptions.body = JSON.stringify(content ?? {});
//     }

//     try {
//       const response = await fetch(this.host + api.replace(/^\/+/, ""), requestOptions);

//       if (!response.ok) throw new CustomError(response);

//       const res = await this.parseResponseJSON(response);
//       if (res?.error) throw new CustomError(response, JSON.stringify(res.error));
//       // Many endpoints in the repo return { data: ... }
//       return res?.data ?? res;
//     } catch (err) {
//       if (err instanceof CustomError && err.content) {
//         try {
//           const errBody = await this.parseResponseJSON(err.content);
//           if (errBody?.errors) err.message = JSON.stringify(errBody.errors);
//         } catch { /* ignore */ }
//       }
//       throw err;
//     }
//   }

//   // Use this for /image and /stitch which expect multipart/form-data
//   static async FormRequest(api, method, formData, headers = {}, options = {}) {
//     const requestOptions = {
//       method,
//       headers: { ...headers }, // do NOT set Content-Type, browser will set boundary
//       body: formData,
//       ...options,
//     };

//     try {
//       const response = await fetch(this.host + api.replace(/^\/+/, ""), requestOptions);

//       if (!response.ok) throw new CustomError(response);

//       const res = await this.parseResponseJSON(response);
//       if (res?.error) throw new CustomError(response, JSON.stringify(res.error));
//       return res?.data ?? res;
//     } catch (err) {
//       if (err instanceof CustomError && err.content) {
//         try {
//           const errBody = await this.parseResponseJSON(err.content);
//           if (errBody?.errors) err.message = JSON.stringify(errBody.errors);
//         } catch { /* ignore */ }
//       }
//       throw err;
//     }
//   }
// }