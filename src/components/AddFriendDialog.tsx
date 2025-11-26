import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Search, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useHabits } from '../contexts/HabitsContext';
import { SearchUser } from '../types';

interface AddFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFriendAdded?: (friend: any) => void;
}

export function AddFriendDialog({ open, onOpenChange, onFriendAdded }: AddFriendDialogProps) {
  const { searchUsers, sendFriendRequest } = useHabits();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    
    try {
      const results = await searchUsers(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Error al buscar usuarios');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (user: SearchUser) => {
    try {
      await sendFriendRequest(user.id);
      toast.success(`¡Solicitud enviada a ${user.username}!`);
      
      // Remover de resultados de búsqueda
      setSearchResults(prev => prev.filter(u => u.id !== user.id));
      
      if (onFriendAdded) {
        onFriendAdded(user);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Error al enviar solicitud');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Agregar Amigos
          </DialogTitle>
          <DialogDescription>
            Busca usuarios por nombre para conectar y competir juntos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="search">Buscar usuarios</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nombre de usuario..."
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={!searchTerm.trim() || isSearching}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search Results */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Buscando usuarios...</p>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.username.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>🔥 {user.currentStreak} días</span>
                        {user.isOnline && (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>En línea</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleAddFriend(user)}>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Seguir
                  </Button>
                </div>
              ))
            ) : searchTerm && !isSearching ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No se encontraron usuarios</p>
                <p className="text-sm">Intenta con otro nombre</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Busca usuarios para conectar</p>
                <p className="text-sm">Escribe un nombre y presiona buscar</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}