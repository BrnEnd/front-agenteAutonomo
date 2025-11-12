import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, APIError } from "@/lib/api-client";
import { StatusResponse, LogEntry } from "@/types/api";
import { Activity, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const statusData = await api.status();
      setStatus(statusData);
    } catch (error) {
      if (error instanceof APIError) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const connected = status?.sessions.filter(s => s.connected).length || 0;
  const disconnected = (status?.activeSessions || 0) - connected;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral do sistema de bots WhatsApp
          </p>
        </div>

        {/* Métricas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sessões Conectadas
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-forgeia-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connected}</div>
              <p className="text-xs text-muted-foreground">
                Bots ativos e funcionando
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aguardando QR
              </CardTitle>
              <Clock className="h-4 w-4 text-forgeia-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{disconnected}</div>
              <p className="text-xs text-muted-foreground">
                Pendentes de autenticação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Sessões
              </CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status?.activeSessions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Todas as sessões registradas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Sessões */}
        <Card>
          <CardHeader>
            <CardTitle>Sessões Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            {!status?.sessions.length ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma sessão ativa no momento
              </p>
            ) : (
              <div className="space-y-4">
                {status.sessions.map((session, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {session.connected ? (
                        <CheckCircle className="h-5 w-5 text-forgeia-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-forgeia-danger" />
                      )}
                      <div>
                        <p className="font-medium">{session.clienteNome}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.whatsappNumero}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        session.connected
                          ? "bg-forgeia-success/20 text-forgeia-success"
                          : "bg-forgeia-danger/20 text-forgeia-danger"
                      }`}
                    >
                      {session.connected ? "Conectado" : "Desconectado"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
