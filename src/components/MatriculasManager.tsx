import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

type Matricula = {
  id: string;
  aluno_id: string;
  curso_id: string;
  ano_ingresso: number;
  semestre_ingresso: number;
  alunos: { nome_completo: string; matricula: string } | null;
  cursos: { nome: string; codigo_curso: string } | null;
};

export default function MatriculasManager() {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    aluno_id: '',
    curso_id: '',
    ano_ingresso: new Date().getFullYear(),
    semestre_ingresso: 1
  });
  const { userRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMatriculas();
    fetchAlunos();
    fetchCursos();
  }, []);

  const fetchMatriculas = async () => {
    const { data, error } = await supabase
      .from('matriculas')
      .select(`
        *,
        alunos (nome_completo, matricula),
        cursos (nome, codigo_curso)
      `)
      .order('ano_ingresso', { ascending: false });

    if (!error && data) {
      setMatriculas(data as any);
    }
  };

  const fetchAlunos = async () => {
    const { data } = await supabase
      .from('alunos')
      .select('id, nome_completo, matricula')
      .eq('status', 'ATIVO')
      .order('nome_completo');

    if (data) setAlunos(data);
  };

  const fetchCursos = async () => {
    const { data } = await supabase
      .from('cursos')
      .select('id, nome, codigo_curso')
      .order('nome');

    if (data) setCursos(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('matriculas')
      .insert(formData);

    if (!error) {
      toast({ title: 'Matrícula realizada com sucesso!' });
      setIsDialogOpen(false);
      resetForm();
      fetchMatriculas();
    } else {
      toast({
        title: 'Erro ao matricular',
        description: error.message.includes('duplicate')
          ? 'Aluno já está matriculado neste curso'
          : error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta matrícula?')) return;

    const { error } = await supabase
      .from('matriculas')
      .delete()
      .eq('id', id);

    if (!error) {
      toast({ title: 'Matrícula excluída com sucesso!' });
      fetchMatriculas();
    }
  };

  const resetForm = () => {
    setFormData({
      aluno_id: '',
      curso_id: '',
      ano_ingresso: new Date().getFullYear(),
      semestre_ingresso: 1
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gerenciar Matrículas</CardTitle>
        {userRole === 'admin' && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Matrícula
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Matrícula</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aluno">Aluno</Label>
                  <Select
                    value={formData.aluno_id}
                    onValueChange={(value) => setFormData({ ...formData, aluno_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos.map((aluno) => (
                        <SelectItem key={aluno.id} value={aluno.id}>
                          {aluno.nome_completo} - {aluno.matricula}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="curso">Curso</Label>
                  <Select
                    value={formData.curso_id}
                    onValueChange={(value) => setFormData({ ...formData, curso_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {cursos.map((curso) => (
                        <SelectItem key={curso.id} value={curso.id}>
                          {curso.nome} ({curso.codigo_curso})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ano_ingresso">Ano de Ingresso</Label>
                    <Input
                      id="ano_ingresso"
                      type="number"
                      min="2000"
                      max="2100"
                      value={formData.ano_ingresso}
                      onChange={(e) => setFormData({ ...formData, ano_ingresso: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="semestre_ingresso">Semestre</Label>
                    <Select
                      value={formData.semestre_ingresso.toString()}
                      onValueChange={(value) => setFormData({ ...formData, semestre_ingresso: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º Semestre</SelectItem>
                        <SelectItem value="2">2º Semestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Matricular
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
                <TableHead>Aluno</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Ingresso</TableHead>
                {userRole === 'admin' && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {matriculas.map((matricula) => (
                <TableRow key={matricula.id}>
                  <TableCell className="font-medium">{matricula.alunos?.nome_completo}</TableCell>
                  <TableCell>{matricula.alunos?.matricula}</TableCell>
                  <TableCell>{matricula.cursos?.nome}</TableCell>
                  <TableCell>
                    {matricula.ano_ingresso}/{matricula.semestre_ingresso}
                  </TableCell>
                  {userRole === 'admin' && (
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(matricula.id)}
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
