import { apiRequest } from "./apiClient";

export type Department = {
  Object_Rel_Idn: number;
  Object_Rel_Name: string;
  Object_Full_Name: string;
  Object_PR_Idn: number;
  children?: Department[];
};

export async function getDepartments(): Promise<Department[]> {
  const response = await apiRequest("/api/departments");
  return response?.data || [];
}

export async function getDepartmentsByParentId(parentId: string | number) {
  const response = await apiRequest(`/api/departments/${parentId}`);

  return {
    departments: response?.data?.departments || [],
    assets: response?.data?.assets || [],
  };
}