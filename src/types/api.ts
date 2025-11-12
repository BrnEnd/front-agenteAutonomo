// Tipos da API Backend

export interface Cliente {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  contexto_arquivo?: string;
  created_at: string;
  updated_at: string;
}

export interface Sessao {
  id: number;
  session_name: string;
  whatsapp_numero: string;
  connected: boolean;
  cliente_id: number;
  cliente_nome?: string;
  created_at: string;
  updated_at: string;
}

export interface StatusResponse {
  activeSessions: number;
  sessions: Array<{
    sessionName: string;
    whatsappNumero: string;
    connected: boolean;
    clienteNome: string;
  }>;
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  uptime: number;
  provider: string;
  model: string;
  library: string;
  activeSessions: number;
  timestamp: string;
}

export interface QRResponse {
  qr: string;
  status: string;
}

export interface LogEntry {
  id: number;
  session_id: number;
  nivel: 'info' | 'warn' | 'error';
  mensagem: string;
  created_at: string;
}

export interface CreateClienteRequest {
  nome: string;
  email?: string;
  telefone?: string;
  contextoArquivo: string;
}

export interface UpdateClienteRequest {
  nome?: string;
  email?: string;
  telefone?: string;
  ativo?: boolean;
}

export interface CreateSessaoRequest {
  clienteId: number;
  whatsappNumero: string;
}
