import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, APIError } from "@/lib/api-client";
import { Sessao, LogEntry } from "@/types/api";
import { FileText, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function Logs() {
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [selectedSessao, setSelectedSessao] = useState<string>("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessoes();
  }, []);

  useEffect(() => {
    if (selectedSessao) {
      loadLogs(parseInt(selectedSessao));
    }
  }, [selectedSessao]);

  const loadSessoes = async () => {
    try {
      const data = await api.sessoes.list();
      setSessoes(data);
      if (data.length > 0) {
        setSelectedSessao(data[0].id.toString());
      }
    } catch (error) {
      if (error instanceof APIError) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (sessaoId: number) => {
    try {
      const data = await api.sessoes.logs(sessaoId, 50);
      setLogs(data);
    } catch (error) {
      if (error instanceof APIError) {
        toast.error(error.message);
      }
    }
  };

  const getLogIcon = (nivel: string) => {
    switch (nivel) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-forgeia-danger" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-forgeia-warning" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getLogColor = (nivel: string) => {
    switch (nivel) {
      case 'error':
        return 'border-forgeia-danger/30 bg-forgeia-danger/10';
      case 'warn':
        return 'border-forgeia-warning/30 bg-forgeia-warning/10';
      default:
        return 'border-border/30 bg-card';
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Logs do Sistema</h2>
            <p className="text-muted-foreground">
              Visualize os logs de cada sessão WhatsApp
            </p>
          </div>
          {sessoes.length > 0 && (
            <div className="w-64">
              <Select value={selectedSessao} onValueChange={setSelectedSessao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma sessão" />
                </SelectTrigger>
                <SelectContent>
                  {sessoes.map((sessao) => (
                    <SelectItem key={sessao.id} value={sessao.id.toString()}>
                      {sessao.whatsapp_numero}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {!sessoes.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhuma sessão disponível para visualizar logs
              </p>
            </CardContent>
          </Card>
        ) : !logs.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhum log encontrado para esta sessão
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <Card key={log.id} className={getLogColor(log.nivel)}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    {getLogIcon(log.nivel)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{log.mensagem}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <span className="text-xs font-medium uppercase px-2 py-1 rounded bg-background/50">
                      {log.nivel}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
