import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Trophy, Calendar, Users, Target } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { useAuth } from '../contexts/AuthContext';

interface CreateChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: any[];
  onChallengeCreated: (challenge: any) => void;
}

const challengeTemplates = [
  {
    id: 'reading',
    title: 'Desafío de Lectura',
    description: 'Leer al menos 20 páginas diarias',
    duration: 7,
    category: 'Educación'
  },
  {
    id: 'exercise',
    title: 'Rutina de Ejercicio',
    description: '30 minutos de actividad física diaria',
    duration: 14,
    category: 'Salud'
  },
  {
    id: 'meditation',
    title: 'Mindfulness Diario',
    description: '10 minutos de meditación cada día',
    duration: 21,
    category: 'Bienestar'
  },
  {
    id: 'custom',
    title: 'Desafío Personalizado',
    description: 'Crea tu propio desafío',
    duration: 7,
    category: 'Personalizado'
  }
];

export function CreateChallengeDialog({ open, onOpenChange, friends, onChallengeCreated }: CreateChallengeDialogProps) {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('7');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTemplateSelect = (templateId: string) => {
    const template = challengeTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setTitle(template.title);
      setDescription(template.description);
      setDuration(template.duration.toString());
    }
  };

  const handleFriendToggle = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !description.trim() || selectedFriends.length === 0) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🏆 Creando desafío...');
      
      const durationDays = parseInt(duration);
      const startDate = new Date();
      const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      // 1. Crear el desafío
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          title: title.trim(),
          description: description.trim(),
          duration: durationDays,
          is_private: isPrivate,
          created_by: user.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        })
        .select()
        .single();

      if (challengeError || !challengeData) {
        console.error('Error creating challenge:', challengeError);
        toast.error('Error al crear el desafío');
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Desafío creado:', challengeData);

      // 2. Agregar al creador como participante
      const allParticipants = [user.id, ...selectedFriends];
      const participantsData = allParticipants.map(userId => ({
        challenge_id: challengeData.id,
        user_id: userId
      }));

      const { error: participantsError } = await supabase
        .from('challenge_participants')
        .insert(participantsData);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        toast.error('Error al agregar participantes');
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Participantes agregados');

      // 3. Crear objeto de desafío para el estado local
      const newChallenge = {
        id: challengeData.id,
        title: challengeData.title,
        description: challengeData.description,
        duration: challengeData.duration,
        participants: allParticipants,
        isPrivate: challengeData.is_private,
        createdAt: new Date(challengeData.created_at),
        startDate: new Date(challengeData.start_date),
        endDate: new Date(challengeData.end_date),
        progress: {}
      };

      onChallengeCreated(newChallenge);
      toast.success('¡Desafío creado exitosamente!');
      
      // Reset form
      setSelectedTemplate('');
      setTitle('');
      setDescription('');
      setDuration('7');
      setSelectedFriends([]);
      setIsPrivate(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Error al crear el desafío');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Crear Nuevo Desafío
          </DialogTitle>
          <DialogDescription>
            Invita a tus amigos a completar un desafío juntos y manténganse motivados.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Templates */}
          <div>
            <Label>Plantillas de Desafío</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {challengeTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`p-3 text-left border rounded-lg transition-colors ${
                    selectedTemplate === template.id 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-sm">{template.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {template.duration}d
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Details */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="title">Título del Desafío</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Desafío de Lectura de 7 días"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe qué deben hacer los participantes..."
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="duration">Duración (días)</Label>
              <Select value={duration} onValueChange={setDuration} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 días</SelectItem>
                  <SelectItem value="7">7 días</SelectItem>
                  <SelectItem value="14">14 días</SelectItem>
                  <SelectItem value="21">21 días</SelectItem>
                  <SelectItem value="30">30 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Friends Selection */}
          <div>
            <Label>Invitar Amigos</Label>
            <p className="text-sm text-gray-600 mb-3">
              Selecciona los amigos que quieres invitar al desafío
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <div key={friend.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      checked={selectedFriends.includes(friend.id)}
                      onCheckedChange={() => handleFriendToggle(friend.id)}
                    />
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={friend.avatar} />
                      <AvatarFallback>
                        {friend.username.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{friend.username}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <span>🔥 {friend.streak} días</span>
                        {friend.isOnline && (
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            <span>En línea</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tienes amigos agregados</p>
                  <p className="text-xs">Agrega amigos primero para crear desafíos</p>
                </div>
              )}
            </div>
            {selectedFriends.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {selectedFriends.length} amigo(s) seleccionado(s)
              </p>
            )}
          </div>

          {/* Privacy */}
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
            <Label className="text-sm">Desafío privado (solo los participantes pueden verlo)</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!title.trim() || !description.trim() || selectedFriends.length === 0 || isSubmitting}
            >
              <Target className="w-4 h-4 mr-2" />
              Crear Desafío
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}