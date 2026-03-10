import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Request failed');
  }
  return data.data;
}

// ─── Dashboard ───
export function useDashboard() {
  return useQuery({ queryKey: ['dashboard'], queryFn: () => apiFetch('/api/dashboard') });
}

// ─── Employees ───
export function useEmployees(params?: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => apiFetch(`/api/employees${query ? `?${query}` : ''}`),
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiFetch('/api/employees', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast.success('Employee added'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateEmployee(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => {
      if (!id) throw new Error('No employee selected');
      return apiFetch(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast.success('Employee updated'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/employees/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast.success('Employee removed'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Departments ───
export function useDepartments(params?: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ['departments', params],
    queryFn: () => apiFetch(`/api/departments${query ? `?${query}` : ''}`),
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiFetch('/api/departments', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Department created'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateDepartment(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiFetch(`/api/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Department updated'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/departments/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Department deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Projects ───
export function useProjects(params?: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => apiFetch(`/api/projects${query ? `?${query}` : ''}`),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiFetch('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project created'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => {
      if (!id) throw new Error('No project selected');
      return apiFetch(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project updated'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Tasks ───
export function useTasks(params?: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => apiFetch(`/api/tasks${query ? `?${query}` : ''}`),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task created'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => {
      if (!id) throw new Error('No task selected');
      return apiFetch(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Expenses ───
export function useExpenses(params?: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () => apiFetch(`/api/expenses${query ? `?${query}` : ''}`),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiFetch('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense submitted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateExpense(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => {
      if (!id) throw new Error('No expense selected');
      return apiFetch(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense updated'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/expenses/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Activity Tracking ───
export function useActivities(entityType?: string, entityId?: string) {
  const params = new URLSearchParams();
  if (entityType) params.set('entityType', entityType);
  if (entityId) params.set('entityId', entityId);
  const query = params.toString();
  
  return useQuery({
    queryKey: ['activities', entityType, entityId],
    queryFn: () => apiFetch(`/api/activities${query ? `?${query}` : ''}`),
    enabled: !!entityType && !!entityId,
  });
}

// ─── Settings ───
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch('/api/settings'),
    refetchOnWindowFocus: false,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { profile?: { name?: string }; settings?: Record<string, any> }) => 
      apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['settings'] }); 
      toast.success('Settings saved successfully'); 
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => 
      apiFetch('/api/user/password', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { 
      toast.success('Password changed successfully'); 
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
