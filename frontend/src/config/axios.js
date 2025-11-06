import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL, // This will use the Vite proxy
	timeout: 10000, // 10 second timeout
	headers: {
		'Content-Type': 'application/json',
	},
})

// Request interceptor to add auth token
api.interceptors.request.use(
	config => {
		const token = localStorage.getItem('token')
		if (token) {
			config.headers.Authorization = `Bearer ${token}`
		}
		return config
	},
	error => {
		return Promise.reject(error)
	}
)

// Response interceptor for error handling
api.interceptors.response.use(
	response => response,
	error => {
		if (error.response?.status === 401) {
			// Token expired or invalid
			localStorage.removeItem('token')
			localStorage.removeItem('user')
			window.location.href = '/register'
		}
		return Promise.reject(error)
	}
)

export default api
