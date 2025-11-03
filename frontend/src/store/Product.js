import { create } from 'zustand'
import api from '../config/axios.js'
import { useLoadingStore } from './Loading.js'
const API_URL = import.meta.env.VITE_API_URL;

export const useProductStore = create(set => ({
	products: [],
	bakerProducts: [],
	categories: [],
	loading: false,
	error: '',
	success: '',

	setProducts: products =>
		set({ products, error: '', success: '', loading: false }),

	createProduct: async (productData, token) => {
		const setLoading = useLoadingStore.getState().setLoading;
		setLoading(true);
		set({ error: '', success: '' });
		
		// Проверка базовых параметров
		if (!productData) {
			set({ error: 'Данные продукта не предоставлены' });
			setLoading(false);
			return { success: false, message: 'Данные продукта не предоставлены' };
		}

		if (!token) {
			set({ error: 'Токен авторизации не предоставлен' });
			setLoading(false);
			return { success: false, message: 'Токен авторизации не предоставлен' };
		}

		try {
			// Проверяем базовый URL API
			console.log('API Base URL:', api.defaults.baseURL);
			console.log('Request URL:', '/products');
			console.log('Full URL:', `${api.defaults.baseURL || ''}/products`);
			
			// Логируем данные запроса (без чувствительной информации)
			console.log('Request headers:', {
				Authorization: `Bearer ${token.substring(0, 10)}...`,
				'Content-Type': 'multipart/form-data',
			});

			const res = await api.post('/products', productData, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'multipart/form-data',
				},
				timeout: 30000, // Увеличиваем timeout до 30 секунд
			});

			console.log('Response received:', res.status, res.statusText);

			// Check the actual response structure from your backend
			const newProduct = res.data?.product || res.data;

			set(state => ({
				products: [...state.products, newProduct],
				bakerProducts: [...state.bakerProducts, newProduct],
				success: '✅ Product successfully added!',
			}));

			return { success: true, product: newProduct };
		} catch (err) {
			console.error('=== DETAILED ERROR LOG ===');
			console.error('Error name:', err.name);
			console.error('Error message:', err.message);
			console.error('Error code:', err.code);
			
			// Проверяем различные типы ошибок
			if (err.code === 'ERR_NETWORK') {
				console.error('Network error - возможно сервер недоступен');
			} else if (err.code === 'ECONNABORTED') {
				console.error('Request timeout - запрос превысил лимит времени');
			}

			if (err.config) {
				console.error('Request config:', {
					method: err.config.method,
					url: err.config.url,
					baseURL: err.config.baseURL,
					timeout: err.config.timeout,
				});
			}

			if (err.response) {
				console.error('Response status:', err.response.status);
				console.error('Response headers:', err.response.headers);
				console.error('Response data:', err.response.data);
			} else {
				console.error('No response received - возможно проблема с сетью или сервер недоступен');
			}

			let errorMessage = 'Произошла ошибка при создании продукта';
			
			if (err.code === 'ERR_NETWORK' || err.message.includes('ERR_CONNECTION_ABORTED')) {
				errorMessage = 'Ошибка подключения к серверу. Проверьте что сервер запущен.';
			} else if (err.code === 'ECONNABORTED') {
				errorMessage = 'Запрос превысил лимит времени. Попробуйте еще раз.';
			} else if (err.response) {
				errorMessage = err.response.data?.message || `Ошибка сервера: ${err.response.status}`;
			}

			set({ error: errorMessage });
			return { success: false, message: errorMessage };
		} finally {
			setLoading(false);
		}
	},

	fetchProductById: async productId => {
		const setLoading = useLoadingStore.getState().setLoading;
		setLoading(true);
		try {
			const res = await api.get(`${API_URL}/products/${productId}`, {
				timeout: 15000
			});
			return res.data || null;
		} catch (err) {
			console.error('Error fetching product by ID:', err.message);
			return null;
		} finally {
			setLoading(false);
		}
	},

	fetchProducts: async (filters = {}) => {
		const setLoading = useLoadingStore.getState().setLoading;
		setLoading(true);
		set({ error: '' });
		try {
			const params = new URLSearchParams();
			if (filters.search) params.append('search', filters.search);
			if (filters.minPrice) params.append('minPrice', filters.minPrice);
			if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
			if (filters.ingredients) params.append('ingredients', filters.ingredients);
			if (filters.minRating) params.append('minRating', filters.minRating);
			if (filters.category) params.append('category', filters.category);
            if (filters.isAvailable !== undefined) params.append('isAvailable', filters.isAvailable);

			const queryString = params.toString();
			const url = queryString ? `/products?${queryString}` : '/products';

			console.log('Fetching products from:', url);

			const res = await api.get(url, {
				timeout: 15000
			});

			let productsData = [];
			if (Array.isArray(res.data)) {
				productsData = res.data;
			} else if (res.data && Array.isArray(res.data.data)) {
				productsData = res.data.data;
			} else if (res.data && Array.isArray(res.data.products)) {
				productsData = res.data.products;
			}

			set({ products: productsData });
		} catch (err) {
			console.error('Error fetching products:', err.message);
			const errorMessage = err.code === 'ERR_NETWORK' ? 
				'Ошибка подключения к серверу' : 
				'Ошибка при загрузке продуктов';
			set({ error: errorMessage });
		} finally {
			setLoading(false);
		}
	},

	fetchProductsByBaker: async bakerId => {
		const setLoading = useLoadingStore.getState().setLoading;
		setLoading(true);
		if (!bakerId) {
			set({ error: 'Baker ID is required', bakerProducts: [] });
			setLoading(false);
			return;
		}

		set({ error: '' });
		try {
			const res = await api.get(`${API_URL}/products/bakers/${bakerId}`, {
				timeout: 15000
			});
			set({ bakerProducts: res.data || [] });
		} catch (err) {
			console.error('Error fetching baker products:', err.message);
			const errorMessage = err.code === 'ERR_NETWORK' ? 
				'Ошибка подключения к серверу' : 
				'Ошибка при загрузке продуктов пекаря';
			set({ error: errorMessage, bakerProducts: [] });
		} finally {
			setLoading(false);
		}
	},

	fetchCategories: async () => {
		const setLoading = useLoadingStore.getState().setLoading;
		setLoading(true);
		set({ error: '' });
		try {
			const res = await api.get(`${API_URL}/categories`, {
				timeout: 15000
			});

			let categoriesData = [];
			if (Array.isArray(res.data)) {
				categoriesData = res.data;
			} else if (res.data && Array.isArray(res.data.data)) {
				categoriesData = res.data.data;
			} else if (res.data && Array.isArray(res.data.categories)) {
				categoriesData = res.data.categories;
			}

			set({ categories: categoriesData });
		} catch (err) {
			console.error('Error fetching categories:', err.message);
			const errorMessage = err.code === 'ERR_NETWORK' ? 
				'Ошибка подключения к серверу' : 
				'Ошибка при загрузке категорий';
			set({ error: errorMessage, categories: [] });
		} finally {
			setLoading(false);
		}
	},

	fetchProductsByCategory: async categoryId => {
		const setLoading = useLoadingStore.getState().setLoading;
		setLoading(true);
		set({ error: '' });
		try {
			await useProductStore.getState().fetchProducts({ category: categoryId });
		} catch (err) {
			console.error('Error fetching products by category:', err.message);
			set({ error: 'Ошибка при загрузке продуктов по категории' });
		} finally {
			setLoading(false);
		}
	},

	deleteProduct: async (productId, token) => {
		const setLoading = useLoadingStore.getState().setLoading;
		setLoading(true);
		set({ error: '', success: '' });
		if (!productId || !token) {
			const errorMsg = 'Product ID и токен обязательны для удаления';
			set({ error: errorMsg });
			setLoading(false);
			return { success: false, message: errorMsg };
		}

		try {
			const res = await api.delete(`${API_URL}/products/${productId}`, {
				headers: { Authorization: `Bearer ${token}` },
				timeout: 15000
			});

			set(state => ({
				products: state.products.filter(p => p._id !== productId),
				bakerProducts: state.bakerProducts.filter(p => p._id !== productId),
				success: '✅ Product successfully deleted!',
			}));

			return { success: true };
		} catch (err) {
			console.error('Error deleting product:', err.message);
			let errorMessage = 'Ошибка при удалении продукта';
			
			if (err.code === 'ERR_NETWORK') {
				errorMessage = 'Ошибка подключения к серверу';
			} else if (err.response) {
				errorMessage = err.response.data?.message || `Ошибка сервера: ${err.response.status}`;
			}

			set({ error: errorMessage });
			return { success: false, message: errorMessage };
		} finally {
			setLoading(false);
		}
	},

	updateProduct: async (productId, productData, token) => {
		const setLoading = useLoadingStore.getState().setLoading
		setLoading(true)
		set({ error: '', success: '' })

		if (!productId || !productData || !token) {
			const errorMsg = 'Product ID, data, and token are required for update'
			set({ error: errorMsg })
			setLoading(false)
			return { success: false, message: errorMsg }
		}

		try {
			const res = await api.put(`${API_URL}/products/${productId}`, productData, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
				timeout: 30000,
			})

			const updatedProduct = res.data?.data || res.data

			set(state => ({
				products: state.products.map(p =>
					p._id === productId ? updatedProduct : p
				),
				bakerProducts: state.bakerProducts.map(p =>
					p._id === productId ? updatedProduct : p
				),
				success: '✅ Product successfully updated!',
			}))

			return { success: true, product: updatedProduct }
		} catch (err) {
			console.error('Error updating product:', err.message)
			let errorMessage = 'An error occurred while updating the product'
			if (err.code === 'ERR_NETWORK') {
				errorMessage = 'Server connection error'
			} else if (err.response) {
				errorMessage =
					err.response.data?.message || `Server error: ${err.response.status}`
			}
			set({ error: errorMessage })
			return { success: false, message: errorMessage }
		} finally {
			setLoading(false)
		}
	},

	clearMessages: () => set({ error: '', success: '' }),
}))