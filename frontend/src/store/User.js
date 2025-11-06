import axios from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
const API_URL = import.meta.env.VITE_API_URL;

export const useUserStore = create(
	persist(
		(set, get) => ({
			user: null,
			token: null,
			userInfo: null, // Здесь должен храниться рейтинг
			errorMessage: '',
			loading: false,
			hydrated: false,

			favorites: [],
			bakerFavorites: [],

			setHydrated: value => set({ hydrated: value }),

			createUser: async formData => {
				set({ loading: true, errorMessage: '' })

				try {
					const res = await fetch(`${API_URL}/auth/register`, {
						method: 'POST',
						body: formData,
					})

					let data
					try {
						data = await res.json()
					} catch {
						data = {}
					}

					if (!res.ok || !data.userData || !data.token) {
						set({
							errorMessage: data.message || data.msg || 'Registration failed',
							loading: false,
						})
						return { success: false, message: data.message || data.msg }
					}

					set({
						user: data.userData,
						token: data.token,
						userInfo: data.userData, // Сохраняем userData также в userInfo
						loading: false,
					})

					// Сохраняем токен в localStorage для axios
					localStorage.setItem('token', data.token)

					// ⭐ Fetch favorites right after register
					await get().fetchFavorites()

					return { success: true, token: data.token, userData: data.userData }
				} catch (err) {
					set({ errorMessage: err.message || 'Network error', loading: false })
					return { success: false, message: err.message }
				}
			},

			loginUser: async credentials => {
				set({ loading: true, errorMessage: '' })
				try {
					const res = await fetch(`${API_URL}/auth/login`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(credentials),
					})
					let data
					try {
						data = await res.json()
					} catch {
						data = {}
					}

					if (!res.ok || !data.userData || !data.token) {
						set({
							errorMessage: data.message || 'Login failed',
							loading: false,
						})
						return { success: false, message: data.message }
					}

					set({
						user: data.userData,
						token: data.token,
						userInfo: data.userData, // Сохраняем userData также в userInfo
						loading: false,
					})

					// Сохраняем токен в localStorage для axios
					localStorage.setItem('token', data.token)

					// ⭐ Fetch favorites right after login
					await get().fetchFavorites()

					return { success: true, token: data.token, userData: data.userData }
				} catch (err) {
					set({ errorMessage: err.message || 'Network error', loading: false })
					return { success: false, message: err.message }
				}
			},

			logoutUser: () => {
				localStorage.clear()
				set({ user: null, token: null, userInfo: null, favorites: [] }) // очищаем userInfo тоже
				window.location.href = '/'
			},

			fetchProfile: async () => {
				const token = get().token
				if (!token) {
					set({ errorMessage: 'No token found. Please login.' })
					return
				}
				set({ loading: true, errorMessage: '' })

				try {
					const res = await fetch(`${API_URL}/auth/profile`, {
						headers: { Authorization: `Bearer ${token}` },
					})
					let data
					try {
						data = await res.json()
					} catch {
						data = {}
					}
					if (!res.ok)
						throw new Error(
							data.message || data.msg || 'Failed to fetch profile data'
						)
					set({ userInfo: data, loading: false })
				} catch (err) {
					set({ errorMessage: err.message, loading: false })
				}
			},

			updateUserProfile: async profileData => {
				set({ loading: true, errorMessage: '' })
				const token = get().token
				if (!token) {
					set({ errorMessage: 'No token found. Please login.', loading: false })
					return { success: false, message: 'No token found.' }
				}

				try {
					const res = await fetch(`${API_URL}/auth/profile`, {
						method: 'PUT',
						headers: {
							Authorization: `Bearer ${token}`,
						},
						body: profileData, // Sending FormData directly
					})

					let data
					try {
						data = await res.json()
					} catch {
						data = {}
					}

					if (!res.ok) {
						set({
							errorMessage: data.message || 'Failed to update profile',
							loading: false,
						})
						return {
							success: false,
							message: data.message || 'Failed to update profile',
						}
					}

					                    set({ userInfo: data.userData, loading: false }) // Assuming backend returns updated user data
					                    return { success: true, userData: data.userData }				} catch (err) {
					set({ errorMessage: err.message || 'Network error', loading: false })
					return { success: false, message: err.message }
				}
			},

			setUserData: ({ user, token }) => set({ user, token }),

			fetchFavorites: async () => {
				try {
					const { token } = get()
					if (!token) return

					const res = await axios.get(`${API_URL}/favorites`, {
						headers: { Authorization: `Bearer ${token}` },
					})

					set({ favorites: res.data })
				} catch (err) {
					console.error('❌ Failed to fetch favorites:', err)
				}
			},

			addFavorite: async product => {
				if (!product || !product._id) {
					console.error('❌ Invalid product passed to addFavorite:', product)
					return
				}

				const { favorites, token } = get()
				try {
					const res = await fetch(`${API_URL}/favorites`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({ productId: product._id }),
					})

					if (!res.ok) throw new Error('Failed to add favorite')

					// Optimistic update
					if (!favorites.find(p => p._id === product._id)) {
						set({ favorites: [...favorites, product] })
					}
				} catch (err) {
					console.error('Add favorite error:', err.message)
				}
			},

			removeFavorite: async productId => {
				const { favorites, token } = get()
				try {
					const res = await fetch(`${API_URL}/favorites/${productId}`, {
						method: 'DELETE',
						headers: {
							Authorization: `Bearer ${token}`,
						},
					})

					if (!res.ok) throw new Error('Failed to remove favorite')

					set({ favorites: favorites.filter(p => p._id !== productId) })
				} catch (err) {
					console.error('Remove favorite error:', err.message)
				}
			},

			fetchCart: async () => {
				try {
					const { token } = get()
					if (!token) return

					const res = await axios.get(`${API_URL}/cart`, {
						headers: { Authorization: `Bearer ${token}` },
					})

					// ✅ Ensure we always return an array
					set({ cart: res.data.items || [] })
				} catch (err) {
					console.error('❌ Error fetching cart:', err)
					set({ cart: [] }) // fallback so map() never breaks
				}
			},

			clearFavorites: () => set({ favorites: [] }),

			fetchBakerFavorites: async () => {
				const { token } = get() // get token from store
				if (!token) return
				try {
					const res = await fetch(`${API_URL}/favorites/bakers`, {
						headers: { Authorization: `Bearer ${token}` },
					})
					const data = await res.json()
					set({ bakerFavorites: data })
				} catch (err) {
					console.error('Error fetching baker favorites:', err)
				}
			},

			addBakerFavorite: async baker => {
				const { token } = get() // get token from store
				if (!token) return
				try {
					await fetch(`${API_URL}/favorites/bakers`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({ bakerId: baker._id }),
					})
					set(state => ({ bakerFavorites: [...state.bakerFavorites, baker] }))
				} catch (err) {
					console.error('Error adding baker favorite:', err)
				}
			},

			removeBakerFavorite: async bakerId => {
				const { token } = get() // get token from store
				if (!token) return
				try {
					await fetch(`${API_URL}/favorites/bakers/${bakerId}`, {
						method: 'DELETE',
						headers: { Authorization: `Bearer ${token}` },
					})
					set(state => ({
						bakerFavorites: state.bakerFavorites.filter(b => b._id !== bakerId),
					}))
				} catch (err) {
					console.error('Error removing baker favorite:', err)
				}
			},

			deleteAccount: async () => {
				set({ loading: true, errorMessage: '' })
				const token = get().token
				if (!token) {
					set({ errorMessage: 'No token found. Please login.', loading: false })
					return { success: false, message: 'No token found.' }
				}

				try {
					const res = await fetch(`${API_URL}/auth/profile`, {
						method: 'DELETE',
						headers: {
							Authorization: `Bearer ${token}`,
						},
					})

					let data
					try {
						data = await res.json()
					} catch {
						data = {}
					}

					if (!res.ok) {
						set({
							errorMessage: data.message || 'Failed to delete account',
							loading: false,
						})
						return {
							success: false,
							message: data.message || 'Failed to delete account',
						}
					}

					// Clear all user data and redirect to home
					localStorage.clear()
					set({
						user: null,
						token: null,
						userInfo: null,
						favorites: [],
						bakerFavorites: [],
						loading: false,
					})

					window.location.href = '/'
					return { success: true, message: 'Account deleted successfully' }
				} catch (err) {
					set({ errorMessage: err.message || 'Network error', loading: false })
					return { success: false, message: err.message }
				}
			},
		}),

		{
			name: 'user-store',
			partialize: state => ({
				user: state.user,
				token: state.token,
				userInfo: state.userInfo, // ✅ Добавляем userInfo в сохраняемые данные
				favorites: state.favorites,
			}),
			onRehydrateStorage: () => state => {
				if (state) {
					state.setHydrated(true)
					// Сохраняем токен в localStorage при rehydration
					if (state.token) {
						localStorage.setItem('token', state.token)
					}
				}
			},
		}
	)
)