import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useHabits } from '../contexts/HabitsContext';
import { Habit } from '../types';
import { toast } from 'sonner@2.0.3';

interface EditHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit | null;
}

const categories = [
  'Salud',
  'Bienestar',
  'Educación',
  'Productividad',
  'Social',
  'Finanzas',
  'Hogar',
  'Creatividad'
];

export function EditHabitDialog({ open, onOpenChange, habit }: EditHabitDialogProps) {
  const { editHabit } = useHabits();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  console.log('EditHabitDialog render - habit:', habit);
  console.log('EditHabitDialog render - open:', open);

  useEffect(() => {
    if (habit) {
      console.log('EditHabitDialog - Setting state from habit:', habit);
      setTitle(habit.title);
      setDescription(habit.description || '');
      setCategory(habit.category);
    } else {
      console.log('EditHabitDialog - Clearing state');
      setTitle('');
      setDescription('');
      setCategory('');
    }
  }, [habit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('EditHabitDialog - handleSubmit called');
    console.log('Form data:', { title, description, category });
    
    if (!habit || !title.trim() || !category) {
      console.log('EditHabitDialog - Validation failed');
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      editHabit(habit.id, title.trim(), description.trim(), category);
      console.log('EditHabitDialog - editHabit called successfully');
      toast.success('Hábito actualizado correctamente');
      onOpenChange(false);
    } catch (error) {
      console.error('EditHabitDialog - Error updating habit:', error);
      toast.error('Error al actualizar el hábito');
    }
  };

  const handleClose = () => {
    console.log('EditHabitDialog - handleClose called');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Hábito</DialogTitle>
          <DialogDescription>
            Modifica los detalles de tu hábito aquí.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Meditar, Hacer ejercicio..."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descripción (opcional)</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tu hábito en detalle..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Categoría</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!title.trim() || !category}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}