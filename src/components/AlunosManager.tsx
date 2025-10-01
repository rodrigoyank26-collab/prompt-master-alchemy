import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';

const alunoSchema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  matricula: z.string().regex(/^\d{4}-[12]-\d{4}$/, 'Formato: AAAA-S-NNNN (ex: 2025-1-1234)'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Formato: XXX.XXX.XXX-XX'),
  email: z.string().email('Email inválido'),
  data_nascimento: z.string(),
  telefone: z.string().optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'TRANCADO', 'FORMADO'])
});

type Aluno = {
  id: string;
  nome_completo: string;
  matricula: string;
  cpf: string;
  email: string;
  data_nascimento: string;
  telefone: string | null;
  status: 'ATIVO' | 'INATIVO' | 'TRANCADO' | 'FORMADO';
};

export default function AlunosManager() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [formData, setFormData] = useState<{
    nome_completo: string;
    matricula: string;
    cpf: string;
    email: string;
    data_nascimento: string;
    telefone: string;
    status: 'ATIVO' | 'INATIVO' | 'TRANCADO' | 'FORMADO';
  }>({
    nome_completo: '',
    matricula: '',
    cpf: '',
    email: '',
    data_nascimento: '',
    telefone: '',
    status: 'ATIVO'
  });
  const { userRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchAlunos();
  }, []);

  const fetchAlunos = async () => {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .order('nome_completo');

    if (!error && data) {
      setAlunos(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      alunoSchema.parse(formData);

      if (editingAluno) {
        const { error } = await supabase
          .from('alunos')
          .update(formData)
          .eq('id', editingAluno.id);

        if (error) throw error;
        toast({ title: 'Aluno atualizado com sucesso!' });
      } else {
        const { error } = await supabase
          .from('alunos')
          .insert(formData);

        if (error) throw error;
        toast({ title: 'Aluno cadastrado com sucesso!' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAlunos();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Erro de validação',
          description: error.errors[0].message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erro ao salvar aluno',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive'
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) return;

    const { error } = await supabase
      .from('alunos')
      .update({ status: 'INATIVO' })
      .eq('id', id);

    if (!error) {
      toast({ title: 'Aluno desativado com sucesso!' });
      fetchAlunos();
    }
  };

  const resetForm = () => {
    setFormData({
      nome_completo: '',
      matricula: '',
      cpf: '',
      email: '',
      data_nascimento: '',
      telefone: '',
      status: 'ATIVO'
    });
    setEditingAluno(null);
  };

  const openEditDialog = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setFormData({
      nome_completo: aluno.nome_completo,
      matricula: aluno.matricula,
      cpf: aluno.cpf,
      email: aluno.email,
      data_nascimento: aluno.data_nascimento,
      telefone: aluno.telefone || '',
      status: aluno.status
    });
    setIsDialogOpen(true);
  };

  const filteredAlunos = alunos.filter(
    aluno =>
      aluno.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.matricula.includes(searchTerm)
  );

  const statusVariant = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'default';
      case 'INATIVO': return 'secondary';
      case 'TRANCADO': return 'outline';
      case 'FORMADO': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gerenciar Alunos</CardTitle>
        {userRole === 'admin' && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAluno ? 'Editar Aluno' : 'Novo Aluno'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="nome_completo">Nome Completo</Label>
                    <Input
                      id="nome_completo"
                      value={formData.nome_completo}
                      onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="matricula">Matrícula</Label>
                    <Input
                      id="matricula"
                      value={formData.matricula}
                      onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                      placeholder="2025-1-1234"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ATIVO">Ativo</SelectItem>
                        <SelectItem value="INATIVO">Inativo</SelectItem>
                        <SelectItem value="TRANCADO">Trancado</SelectItem>
                        <SelectItem value="FORMADO">Formado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  {editingAluno ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                {userRole === 'admin' && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlunos.map((aluno) => (
                <TableRow key={aluno.id}>
                  <TableCell className="font-medium">{aluno.nome_completo}</TableCell>
                  <TableCell>{aluno.matricula}</TableCell>
                  <TableCell>{aluno.email}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(aluno.status)}>{aluno.status}</Badge>
                  </TableCell>
                  {userRole === 'admin' && (
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(aluno)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(aluno.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
