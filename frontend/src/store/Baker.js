import { create } from 'zustand'
import { useLoadingStore } from './Loading.js' // Import useLoadingStore
const API_URL = import.meta.env.VITE_API_URL;

export const useBakerStore = create(set => ({
	bakers: [],
	selectedBaker: null,

	fetchBakers: async () => {
		const setLoadingGlobal = useLoadingStore.getState().setLoading; // Get global setLoading
		setLoadingGlobal(true); // Set global loading to true
		try {
			const response = await fetch(`${API_URL}/auth/bakers`);
			if (!response.ok) {
				const errorData = await response.json();
				console.error('Failed to fetch bakers:', errorData.msg || response.statusText);
				set({ bakers: [] }); // Ensure bakers is an empty array on error
				return;
			}
			const data = await response.json();
			set({ bakers: data });
		} catch (error) {
			console.error('Failed to fetch bakers', error);
			set({ bakers: [] }); // Ensure bakers is an empty array on network error
		} finally {
			setLoadingGlobal(false); // Set global loading to false
		}
	},

	fetchBakerById: async bakerId => {
		const setLoadingGlobal = useLoadingStore.getState().setLoading; // Get global setLoading
		setLoadingGlobal(true); // Set global loading to true
		try {
			const response = await fetch(`${API_URL}/auth/bakers/${bakerId}`);
			if (!response.ok) {
				const errorData = await response.json();
				console.error(`Failed to fetch baker ${bakerId}:`, errorData.msg || response.statusText);
				set({ selectedBaker: null }); // Ensure selectedBaker is null on error
				return;
			}
			const data = await response.json();
			set({ selectedBaker: data });
		} catch (error) {
			console.error('Failed to fetch baker', error);
			set({ selectedBaker: null }); // Ensure selectedBaker is null on network error
		} finally {
			setLoadingGlobal(false); // Set global loading to false
		}
	},

	clearSelectedBaker: () => set({ selectedBaker: null }),
}))
