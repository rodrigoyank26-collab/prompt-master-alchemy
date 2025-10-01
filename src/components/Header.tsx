import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GraduationCap, LogOut, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Header() {
  const { signOut, user, userRole } = useAuth();

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Sistema de Gestão Acadêmica</h1>
            <p className="text-sm text-muted-foreground">Controle completo de alunos, cursos e matrículas</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{user.email}</span>
                {userRole && (
                  <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
                    {userRole === 'admin' ? 'Admin' : 'Leitor'}
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
