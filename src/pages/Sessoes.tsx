import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, APIError } from "@/lib/api-client";
import { Sessao, Cliente } from "@/types/api";
import { Plus, Trash2, QrCode, Key, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import QRCodeLib from "qrcode";

export default function Sessoes() {
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [pairingDialogOpen, setPairingDialogOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState<string>("");
  const [selectedSessao, setSelectedSessao] = useState<Sessao | null>(null);
  const [formData, setFormData] = useState({
    clienteId: "",
    whatsappNumero: "",
  });

  useEffect(() => {
    loadData();

    // Atualizar lista a cada 10 segundos para refletir mudanças de status
    const interval = setInterval(() => {
      loadData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }

    try {
      const [sessoesData, clientesData] = await Promise.all([
        api.sessoes.list(),
        api.clientes.list(true),
      ]);
      setSessoes(sessoesData);
      setClientes(clientesData);

      if (isManualRefresh) {
        toast.success("Lista atualizada!");
      }
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      if (error instanceof APIError) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.sessoes.create({
        clienteId: parseInt(formData.clienteId),
        whatsappNumero: formData.whatsappNumero,
      });

      toast.success("Sessão criada com sucesso! Clique em 'Ver QR Code' ou 'Código de Pareamento' para conectar.");
      setDialogOpen(false);
      setFormData({ clienteId: "", whatsappNumero: "" });

      loadData();
    } catch (error) {
      if (error instanceof APIError) {
        toast.error(error.message);
      }
    }
  };

  const pollQRCode = async (sessaoId: number, attempts = 0) => {
    if (attempts >= 20) {
      toast.error("Timeout ao aguardar QR Code");
      return;
    }

    try {
      const response: any = await api.sessoes.qr(sessaoId);

      if (response.qr) {
        const sessao = sessoes.find(s => s.id === sessaoId);
        setSelectedSessao(sessao || null);
        setQrDialogOpen(true);

        // Renderizar QR Code
        setTimeout(async () => {
          const el = document.getElementById('qr-container');

          if (el) {
            try {
              el.innerHTML = '';

              const img = document.createElement('img');
              img.style.width = '256px';
              img.style.height = '256px';
              img.style.margin = 'auto';

              const qrDataUrl = await QRCodeLib.toDataURL(response.qr, {
                width: 256,
                margin: 2,
                color: {
                  dark: '#000000',
                  light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
              });

              img.src = qrDataUrl;
              el.appendChild(img);
            } catch (error) {
              console.error('Erro ao gerar QR Code:', error);
              el.innerHTML = '<p style="color: red;">Erro ao gerar QR Code</p>';
            }
          }
        }, 100);
      } else if (response.status === 'connected') {
        setQrDialogOpen(false);
        await updateSessaoStatus(sessaoId);
        toast.success("Sessão conectada com sucesso!");
      } else {
        setTimeout(() => pollQRCode(sessaoId, attempts + 1), 3000);
      }
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        setTimeout(() => pollQRCode(sessaoId, attempts + 1), 3000);
      } else {
        console.error('Erro ao obter QR Code:', error);
        toast.error("Erro ao obter QR Code");
      }
    }
  };

  const requestPairingCode = async (sessao: Sessao) => {
    setSelectedSessao(sessao);
    setPairingCode("");

    try {
      toast.info("Solicitando código de pareamento...");

      const response = await api.sessoes.pairingCode(sessao.id, sessao.whatsapp_numero);

      if (response.code) {
        setPairingCode(response.code);
        setPairingDialogOpen(true);
        toast.success("Código de pareamento gerado!");

        setTimeout(() => {
          pollConnection(sessao.id);
        }, 5000);
      } else {
        toast.error("Não foi possível gerar o código de pareamento");
      }
    } catch (error) {
      console.error('Erro ao solicitar código de pareamento:', error);
      if (error instanceof APIError) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao solicitar código de pareamento");
      }
    }
  };

  const updateSessaoStatus = async (sessaoId: number) => {
    try {
      const sessaoAtualizada = await api.sessoes.get(sessaoId);

      setSessoes(prevSessoes =>
        prevSessoes.map(s =>
          s.id === sessaoId ? sessaoAtualizada : s
        )
      );
      return sessaoAtualizada;
    } catch (error) {
      console.error('Erro ao atualizar status da sessão:', error);
      throw error;
    }
  };

  const pollConnection = async (sessaoId: number, attempts = 0) => {
    if (attempts >= 20) {
      return;
    }

    try {
      const response = await api.sessoes.qr(sessaoId);

      if (response.status === 'connected') {
        setPairingDialogOpen(false);
        await updateSessaoStatus(sessaoId);
        toast.success("Sessão conectada com sucesso!");
      } else {
        setTimeout(() => pollConnection(sessaoId, attempts + 1), 3000);
      }
    } catch (error) {
      setTimeout(() => pollConnection(sessaoId, attempts + 1), 3000);
    }
  };

  const showQRCode = async (sessao: Sessao) => {
    setSelectedSessao(sessao);
    setQrDialogOpen(true);

    try {
      const response = await api.sessoes.qr(sessao.id);

      if (response.qr) {
        setTimeout(async () => {
          const el = document.getElementById('qr-container');

          if (el) {
            try {
              el.innerHTML = '';

              const img = document.createElement('img');
              img.style.width = '256px';
              img.style.height = '256px';
              img.style.margin = 'auto';

              const qrDataUrl = await QRCodeLib.toDataURL(response.qr, {
                width: 256,
                margin: 2,
                color: {
                  dark: '#000000',
                  light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
              });

              img.src = qrDataUrl;
              el.appendChild(img);
            } catch (error) {
              console.error('Erro ao criar QRCode:', error);
              el.innerHTML = '<p style="color: red;">Erro ao gerar QR Code</p>';
            }
          }
        }, 100);
      } else if (response.status === 'connected') {
        toast.success("Sessão já está conectada!");
        setQrDialogOpen(false);
        loadData();
      } else {
        pollQRCode(sessao.id);
      }
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
      if (error instanceof APIError) {
        toast.error(error.message);
      }
      pollQRCode(sessao.id);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar esta sessão?")) {
      return;
    }

    try {
      await api.sessoes.delete(id);
      toast.success("Sessão deletada com sucesso!");
      loadData();
    } catch (error) {
      if (error instanceof APIError) {
        toast.error(error.message);
      }
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
            <h2 className="text-3xl font-bold tracking-tight">Sessões WhatsApp</h2>
            <p className="text-muted-foreground">
              Gerencie as conexões WhatsApp dos bots
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => loadData(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Sessão
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Sessão WhatsApp</DialogTitle>
                <DialogDescription>
                  Crie uma nova sessão para conectar um número WhatsApp
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cliente">Cliente *</Label>
                    <Select
                      value={formData.clienteId}
                      onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            {cliente.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="numero">Número WhatsApp *</Label>
                    <Input
                      id="numero"
                      value={formData.whatsappNumero}
                      onChange={(e) => setFormData({ ...formData, whatsappNumero: e.target.value })}
                      placeholder="5511999999999"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Formato: código do país + DDD + número (sem espaços ou caracteres especiais)
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Criar Sessão</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>QR Code - {selectedSessao?.whatsapp_numero}</DialogTitle>
              <DialogDescription>
                Escaneie este QR Code com o WhatsApp para conectar
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-6">
              <div id="qr-container" className="border border-border p-4 rounded-lg bg-white"></div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={pairingDialogOpen} onOpenChange={setPairingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Código de Pareamento - {selectedSessao?.whatsapp_numero}</DialogTitle>
              <DialogDescription>
                Digite este código no seu WhatsApp para conectar
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="text-sm text-muted-foreground text-center">
                <p>1. Abra o WhatsApp no seu celular</p>
                <p>2. Vá em Configurações → Aparelhos conectados</p>
                <p>3. Toque em "Conectar aparelho"</p>
                <p>4. Digite o código abaixo quando solicitado</p>
              </div>
              {pairingCode ? (
                <div className="bg-primary/10 border-2 border-primary rounded-lg p-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Código de Pareamento:</p>
                    <p className="text-4xl font-mono font-bold tracking-widest text-primary">
                      {pairingCode}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Gerando código...</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Este código expira em alguns minutos. Se não funcionar, gere um novo código.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid gap-4">
          {sessoes.map((sessao) => (
            <Card key={sessao.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{sessao.whatsapp_numero}</CardTitle>
                    <CardDescription>
                      Cliente: {sessao.cliente_nome || `ID ${sessao.cliente_id}`}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      sessao.connected
                        ? "bg-forgeia-success/20 text-forgeia-success"
                        : "bg-forgeia-warning/20 text-forgeia-warning"
                    }`}
                  >
                    {sessao.connected ? "Conectado" : "Desconectado"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {!sessao.connected && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => showQRCode(sessao)}
                      >
                        <QrCode className="h-4 w-4 mr-1" />
                        Ver QR Code
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => requestPairingCode(sessao)}
                      >
                        <Key className="h-4 w-4 mr-1" />
                        Código de Pareamento
                      </Button>
                    </>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(sessao.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Deletar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!sessoes.length && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhuma sessão criada. Crie a primeira sessão para conectar um número WhatsApp!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
