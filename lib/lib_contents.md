The lib folder is typically used for utility code and shared modules that can be reused across your project. Here are some examples of what you might include:
	•	API Clients:
Files like supabaseClient.js or other service clients (e.g., Axios instances, GraphQL clients) that handle external API requests.
	•	Helper Functions:
Utility functions that are used in multiple parts of your app, such as data formatting, common calculations, or string manipulation utilities.
	•	Constants & Configurations:
Files for application-wide constants, configurations, or environment-related settings that aren’t tied to a specific component.
	•	Custom Hooks (if not colocated):
You might store custom React hooks that can be shared across components if they aren’t directly tied to a particular feature or page.
	•	Middlewares or Wrappers:
Common middlewares or wrappers used in API routes or server-side functions.