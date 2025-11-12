import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, APIError } from "@/lib/api-client";
import { HealthResponse } from "@/types/api";
import { Activity, Server, Cpu, Clock } from "lucide-react";
import { toast } from "sonner";

export default function Health() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 10000); // Atualiza a cada 10s
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const data = await api.health();
      setHealth(data);
    } catch (error) {
      if (error instanceof APIError) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Health Check</h2>
          <p className="text-muted-foreground">
            Status e informações do sistema
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Status
              </CardTitle>
              <Activity className="h-4 w-4 text-forgeia-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{health?.status}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Sistema operacional
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Uptime
              </CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {health ? formatUptime(health.uptime) : '-'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tempo em operação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sessões Ativas
              </CardTitle>
              <Server className="h-4 w-4 text-forgeia-cyan" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health?.activeSessions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Bots em execução
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Provider IA
              </CardTitle>
              <Cpu className="h-4 w-4 text-forgeia-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{health?.provider}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {health?.model}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Técnicas</CardTitle>
            <CardDescription>
              Detalhes da configuração do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Biblioteca WhatsApp</dt>
                <dd className="mt-1 text-lg font-semibold">{health?.library}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Modelo de IA</dt>
                <dd className="mt-1 text-lg font-semibold">{health?.model}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Provider</dt>
                <dd className="mt-1 text-lg font-semibold">{health?.provider}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Última Atualização</dt>
                <dd className="mt-1 text-lg font-semibold">
                  {health ? new Date(health.timestamp).toLocaleString('pt-BR') : '-'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
