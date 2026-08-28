import { apiRequest } from "./apiClient";

export type AssetListItem = {
  _Idn: number;
  Object_Agent: "EM" | "MDM" | string;
  Object_DeviceID: string;
  ComputerName: string;
  Object_Full_Name: string;
  PlatformType: string;
  Model: string;
  ConnectionTime: string;
  ConnectionStatus: string;
  IP: string;
};

export async function getAssetsByRelationId(
  relationId: string | number
): Promise<AssetListItem[]> {
  const response = await apiRequest(`/api/assets/${relationId}`);
  return response?.data || [];
}

export async function getAssetDetail(
  objectAgent: "EM" | "MDM",
  assetId: string | number
) {
  const response = await apiRequest(`/api/asset/${objectAgent}/${assetId}`);
  return response?.data || {};
}