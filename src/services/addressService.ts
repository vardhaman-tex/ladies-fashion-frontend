import { api } from "@/lib/api";
import type { AddressData, AddressRequest } from "@/types/address";

const BASE = "/api/v1/addresses";

export async function getAddresses(): Promise<AddressData[]> {
  const { data } = await api.get<{ data: AddressData[] }>(BASE);
  return data.data;
}

export async function addAddress(request: AddressRequest): Promise<AddressData> {
  const { data } = await api.post<{ data: AddressData }>(BASE, request);
  return data.data;
}

export async function updateAddress(id: string, request: AddressRequest): Promise<AddressData> {
  const { data } = await api.put<{ data: AddressData }>(`${BASE}/${id}`, request);
  return data.data;
}

export async function deleteAddress(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

export async function setDefaultAddress(id: string): Promise<AddressData> {
  const { data } = await api.put<{ data: AddressData }>(`${BASE}/${id}/default`);
  return data.data;
}
