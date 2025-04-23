import axios from 'axios';

export interface ShipmentItem {
  name: string;
  phone: string;
  product: string;
  qty: number;
  price: number;
}

export async function getShipmentListByBatch(batchId: string): Promise<ShipmentItem[]> {
  const res = await axios.get(`/api/databroadcastbatch/${batchId}`);
  return res.data;
}
