import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { z } from 'zod';

const cursoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  codigo_curso: z.string().min(2, 'Código deve ter no mínimo 2 caracteres'),
  duracao_semestres: z.number().min(1, 'Duração deve ser no mínimo 1 semestre')
});

type Curso = {
  id: string;
  nome: string;
  codigo_curso: string;
  duracao_semestres: number;
};

export default function CursosManager() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    codigo_curso: '',
    duracao_semestres: 8
  });
  const { userRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .order('nome');

    if (!error && data) {
      setCursos(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      cursoSchema.parse(formData);

      if (editingCurso) {
        const { error } = await supabase
          .from('cursos')
          .update(formData)
          .eq('id', editingCurso.id);

        if (error) throw error;
        toast({ title: 'Curso atualizado com sucesso!' });
      } else {
        const { error } = await supabase
          .from('cursos')
          .insert(formData);

        if (error) throw error;
        toast({ title: 'Curso cadastrado com sucesso!' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCursos();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Erro de validação',
          description: error.errors[0].message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erro ao salvar curso',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive'
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return;

    const { error } = await supabase
      .from('cursos')
      .delete()
      .eq('id', id);

    if (!error) {
      toast({ title: 'Curso excluído com sucesso!' });
      fetchCursos();
    } else {
      toast({
        title: 'Erro ao excluir curso',
        description: 'Pode haver alunos matriculados neste curso',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      codigo_curso: '',
      duracao_semestres: 8
    });
    setEditingCurso(null);
  };

  const openEditDialog = (curso: Curso) => {
    setEditingCurso(curso);
    setFormData({
      nome: curso.nome,
      codigo_curso: curso.codigo_curso,
      duracao_semestres: curso.duracao_semestres
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gerenciar Cursos</CardTitle>
        {userRole === 'admin' && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Curso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCurso ? 'Editar Curso' : 'Novo Curso'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Curso</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    placeholder="Engenharia de Software"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo_curso">Código do Curso</Label>
                  <Input
                    id="codigo_curso"
                    value={formData.codigo_curso}
                    onChange={(e) => setFormData({ ...formData, codigo_curso: e.target.value })}
                    required
                    placeholder="ENG-SW"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duracao_semestres">Duração (Semestres)</Label>
                  <Input
                    id="duracao_semestres"
                    type="number"
                    min="1"
                    value={formData.duracao_semestres}
                    onChange={(e) => setFormData({ ...formData, duracao_semestres: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingCurso ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Duração</TableHead>
                {userRole === 'admin' && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cursos.map((curso) => (
                <TableRow key={curso.id}>
                  <TableCell className="font-medium">{curso.nome}</TableCell>
                  <TableCell>{curso.codigo_curso}</TableCell>
                  <TableCell>{curso.duracao_semestres} semestres</TableCell>
                  {userRole === 'admin' && (
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(curso)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(curso.id)}
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
