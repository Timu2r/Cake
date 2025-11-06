import { create } from 'zustand'
import api from '../config/axios.js'
import { useCartStore } from './Cart'
import { useUserStore } from './User'
import { useLoadingStore } from './Loading.js'
const API_URL = import.meta.env.VITE_API_URL;

export const useOrderStore = create((set, get) => ({
	orders: [],
	customOrders: [],
	newOrders: [],
	completedOrders: [],
	allBakerOrders: [],

	placeOrder: async (token, orderData) => {
		const setLoading = useLoadingStore.getState().setLoading;
		setLoading(true);
		try {
			const { setCart } = useCartStore.getState()

			if (!orderData?.items || orderData.items.length === 0) {
				throw new Error('Order has no items')
			}

			const res = await api.post(`${API_URL}/orders`, orderData, {
				headers: { Authorization: `Bearer ${token}` },
			})

			setCart([])
			set(state => ({ orders: [...state.orders, res.data] }))
            get().fetchBakerOrders(token);
			return res.data
		} catch (error) {
			console.error(error.response?.data || error.message)
			throw error
		} finally {
			setLoading(false);
		}
	},

	placeCustomOrder: async (token, orderDetails) => {
		const setLoading = useLoadingStore.getState().setLoading;
		setLoading(true);
		try {
			const res = await api.post(`${API_URL}/orders/custom`, orderDetails, {
				headers: { Authorization: `Bearer ${token}` },
			})
			set(state => ({ customOrders: [...state.customOrders, res.data] }))
            get().fetchBakerOrders(token);
			return res.data
		} catch (error) {
			console.error(error.response?.data || error.message)
			throw error
		} finally {
			setLoading(false);
		}
	},

	fetchOrders: async token => {
		const setLoading = useLoadingStore.getState().setLoading;
		setLoading(true);
		try {
			const res = await api.get(`${API_URL}/orders/my-orders`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			set({ orders: res.data })
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false);
		}
	},

	fetchNewBakerOrders: async token => {
		const setLoading = useLoadingStore.getState().setLoading;
		setLoading(true);
		try {
			const res = await api.get(`${API_URL}/orders/baker/new`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			set({ newOrders: res.data })
		} catch (error) {
			console.error('❌ Error fetching new baker orders:', error)
		} finally {
			setLoading(false);
		}
	},

	fetchCompletedBakerOrders: async token => {
		const setLoading = useLoadingStore.getState().setLoading;
		setLoading(true);
		try {
			const res = await api.get(`${API_URL}/orders/baker/completed`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			const { userInfo } = useUserStore.getState()
			if (!userInfo) {
				console.error('User info not available in order store')
				set({ completedOrders: [] })
				return
			}
			const filteredOrders = res.data.filter(
				order => order.baker === userInfo._id
			)
			set({ completedOrders: filteredOrders })
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false);
		}
	},

	fetchAllBakerOrders: async token => {
		const setLoading = useLoadingStore.getState().setLoading;
		setLoading(true);
		try {
			const res = await api.get(`${API_URL}/orders/baker-orders`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			const inProgress = new Set(['accepted', 'confirmed', 'shipped'])
			const filteredOrders = res.data.filter(order =>
				inProgress.has(order.status)
			)
			set({
				allBakerOrders: filteredOrders,
			})
		} catch (error) {
			console.error('❌ Error fetching all baker orders:', error)
		} finally {
			setLoading(false);
		}
	},

	fetchBakerOrders: async token => {
		const {
			fetchNewBakerOrders,
			fetchCompletedBakerOrders,
			fetchAllBakerOrders,
		} = get()
		await fetchNewBakerOrders(token)
		await fetchCompletedBakerOrders(token)
		await fetchAllBakerOrders(token)
	},

	updateOrderStatus: async (token, orderId, status, reason = '') => {
		const setLoading = useLoadingStore.getState().setLoading;
		setLoading(true);
		try {
			const res = await api.put(
				`${API_URL}/orders/${orderId}/status`,
				{ status, reason },
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			)
			set(state => ({
				orders: state.orders.map(o => (o._id === orderId ? res.data : o)),
				customOrders: state.customOrders.map(o =>
					o._id === orderId ? res.data : o
				),
				newOrders: state.newOrders.map(o => (o._id === orderId ? res.data : o)),
				completedOrders: state.completedOrders.map(o =>
					o._id === orderId ? res.data : o
				),
				allBakerOrders: state.allBakerOrders.map(o =>
					o._id === orderId ? res.data : o
				),
			}))
			await get().fetchBakerOrders(token)
			return res.data
		} catch (error) {
			console.error(error.response?.data || error.message)
			throw error
		} finally {
			setLoading(false);
		}
	},

	deleteOrder: async (token, orderId) => {
		const setLoading = useLoadingStore.getState().setLoading;
		setLoading(true);
		try {
			await api.delete(`${API_URL}/orders/${orderId}`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			set(state => ({
				orders: state.orders.filter(o => o._id !== orderId),
				customOrders: state.customOrders.filter(o => o._id !== orderId),
				newOrders: state.newOrders.filter(o => o._id !== orderId),
				completedOrders: state.completedOrders.filter(o => o._id !== orderId),
				allBakerOrders: state.allBakerOrders.filter(o => o._id !== orderId),
			}))
			return { success: true, message: 'Order deleted successfully' }
		} catch (error) {
			console.error(error.response?.data || error.message)
			throw error
		} finally {
			setLoading(false);
		}
	},

	deleteUserOrder: async (token, orderId) => {
		const setLoading = useLoadingStore.getState().setLoading;
		setLoading(true);
		try {
			await api.delete(`${API_URL}/orders/user/${orderId}`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			set(state => ({
				orders: state.orders.filter(o => o._id !== orderId),
				customOrders: state.customOrders.filter(o => o._id !== orderId),
			}))
			return { success: true, message: 'Order deleted successfully' }
		} catch (error) {
			console.error(error.response?.data || error.message)
			throw error
		} finally {
			setLoading(false);
		}
	},
}))