import api from '../api';

export async function openBox(id: string) {
    const response = await api.post(`/games/openCase/${id}`);
    return response.data;
}

export async function upgradeItem(selectedItemIds: string[], targetItemId: string) {
    const response = await api.post(`/games/upgrade/`, { selectedItemIds, targetItemId });
    return response.data;
}

export async function spinSlots(betAmount: number) {
    const response = await api.post(`/games/slots/`, {
        betAmount
    });
    return response.data;
}