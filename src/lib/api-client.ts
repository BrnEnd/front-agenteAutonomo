import { supabase } from "@/integrations/supabase/client";
import type { 
  HealthResponse, 
  StatusResponse, 
  Cliente, 
  Sessao, 
  QRResponse, 
  LogEntry 
} from "@/types/api";

// Base URL da API - configurável via variável de ambiente
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // Mapear erros HTTP para mensagens amigáveis
      const errorMessage = data?.error || getErrorMessage(response.status);
      throw new APIError(response.status, errorMessage, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    // Erro de rede ou outro erro
    throw new APIError(0, 'Erro de conexão com o servidor', error);
  }
}

function getErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Dados inválidos enviados';
    case 401:
      return 'Não autorizado. Faça login novamente';
    case 403:
      return 'Acesso negado';
    case 404:
      return 'Recurso não encontrado';
    case 500:
      return 'Erro interno do servidor';
    default:
      return `Erro na requisição (${status})`;
  }
}

// Função auxiliar para transformar resposta do backend em Sessao
function transformSessaoResponse(backendData: any): Sessao {
  return {
    ...backendData,
    // Transforma status string em connected boolean
    connected: backendData.status === 'conectado',
  };
}

export const api = {
  // Sistema
  health: (): Promise<HealthResponse> => apiRequest('/health'),
  status: (): Promise<StatusResponse> =>
    apiRequest('/status').then((data: any) => ({
      ...data,
      sessions: data.sessions?.map((session: any) => ({
        ...session,
        connected: session.status === 'conectado' || session.connected === true,
      })) || []
    })),

  // Clientes
  clientes: {
    list: (ativos = true): Promise<Cliente[]> =>
      apiRequest(`/clientes?ativos=${ativos}`),
    get: (id: number): Promise<Cliente> =>
      apiRequest(`/clientes/${id}`),
    create: (data: any): Promise<Cliente> =>
      apiRequest('/clientes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: any): Promise<Cliente> =>
      apiRequest(`/clientes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    updateContexto: (id: number, contextoArquivo: string): Promise<Cliente> =>
      apiRequest(`/clientes/${id}/contexto`, {
        method: 'PUT',
        body: JSON.stringify({ contextoArquivo }),
      }),
    delete: (id: number): Promise<{ message: string }> =>
      apiRequest(`/clientes/${id}`, {
        method: 'DELETE',
      }),
    sessoes: (id: number): Promise<Sessao[]> =>
      apiRequest(`/clientes/${id}/sessoes`).then((sessoes: any[]) =>
        sessoes.map(transformSessaoResponse)
      ),
  },

  // Sessões
  sessoes: {
    list: (): Promise<Sessao[]> =>
      apiRequest('/sessoes').then((sessoes: any[]) =>
        sessoes.map(transformSessaoResponse)
      ),
    get: (id: number): Promise<Sessao> =>
      apiRequest(`/sessoes/${id}`).then(transformSessaoResponse),
    create: (data: any): Promise<Sessao> =>
      apiRequest('/sessoes', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(transformSessaoResponse),
    delete: (id: number): Promise<{ message: string }> =>
      apiRequest(`/sessoes/${id}`, {
        method: 'DELETE',
      }),
    qr: (id: number): Promise<QRResponse> => apiRequest(`/sessoes/${id}/qr`),
    pairingCode: (id: number, phoneNumber: string): Promise<{ code: string }> =>
      apiRequest(`/sessoes/${id}/pairing-code`, {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      }),
    logs: (id: number, limit = 10): Promise<LogEntry[]> =>
      apiRequest(`/sessoes/${id}/logs?limit=${limit}`),
  },
};

export { APIError };
