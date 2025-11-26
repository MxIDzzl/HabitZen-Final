import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useHabits } from '../contexts/HabitsContext';
import { Plus, CheckCircle2, Circle, MoreVertical, Trash2, Edit, Share2 } from 'lucide-react';
import { AddHabitDialog } from './AddHabitDialog';
import { EditHabitDialog } from './EditHabitDialog';
import { Habit } from '../types';
import { toast } from 'sonner@2.0.3';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

export function MyHabits() {
  const { habits, completeHabit, uncompleteHabit, deleteHabit, shareHabitToCommunity, getDailyCompletionRate } = useHabits();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const pendingHabits = habits.filter(h => !h.isCompleted);
  const completedHabits = habits.filter(h => h.isCompleted);
  const completionRate = getDailyCompletionRate();

  console.log('MyHabits render - habits:', habits.length);
  console.log('MyHabits render - selectedHabit:', selectedHabit);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Salud': 'bg-green-100 text-green-800',
      'Bienestar': 'bg-purple-100 text-purple-800',
      'Educación': 'bg-blue-100 text-blue-800',
      'Productividad': 'bg-orange-100 text-orange-800',
      'Social': 'bg-pink-100 text-pink-800',
      'Finanzas': 'bg-emerald-100 text-emerald-800',
      'Hogar': 'bg-yellow-100 text-yellow-800',
      'Creatividad': 'bg-violet-100 text-violet-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleEdit = (habit: Habit) => {
    console.log('handleEdit called with habit:', habit);
    setSelectedHabit(habit);
    setShowEditDialog(true);
    setOpenMenuId(null);
  };

  const handleDelete = (habit: Habit) => {
    console.log('handleDelete called with habit:', habit);
    setSelectedHabit(habit);
    setShowDeleteDialog(true);
    setOpenMenuId(null);
  };

  const confirmDelete = () => {
    console.log('confirmDelete called with selectedHabit:', selectedHabit);
    if (selectedHabit) {
      deleteHabit(selectedHabit.id);
      toast.success('Hábito eliminado correctamente');
      setSelectedHabit(null);
      setShowDeleteDialog(false);
    }
  };

  const handleShare = (habit: Habit) => {
    console.log('handleShare called with habit:', habit);
    try {
      shareHabitToCommunity(habit.id);
      toast.success('¡Hábito compartido en la comunidad!');
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error sharing habit:', error);
      toast.error('Error al compartir el hábito');
    }
  };

  const toggleMenu = (habitId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('toggleMenu called with habitId:', habitId);
    setOpenMenuId(openMenuId === habitId ? null : habitId);
  };

  const handleEditDialogClose = (open: boolean) => {
    console.log('handleEditDialogClose called with open:', open);
    setShowEditDialog(open);
    if (!open) {
      setSelectedHabit(null);
    }
  };

  const handleDeleteDialogClose = (open: boolean) => {
    console.log('handleDeleteDialogClose called with open:', open);
    setShowDeleteDialog(open);
    if (!open) {
      setSelectedHabit(null);
    }
  };

  const HabitCard = ({ habit, isCompleted = false }: { habit: Habit, isCompleted?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <Card className={isCompleted ? 'opacity-60' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <button
                onClick={() => isCompleted ? uncompleteHabit(habit.id) : completeHabit(habit.id)}
                className="mt-1"
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-400 hover:text-green-500 transition-colors" />
                )}
              </button>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className={`font-medium ${isCompleted ? 'line-through' : ''}`}>
                    {habit.title}
                  </h3>
                </div>
                
                {habit.description && (
                  <p className="text-sm text-gray-600 mb-2">{habit.description}</p>
                )}
                
                <Badge variant="secondary" className={getCategoryColor(habit.category)}>
                  {habit.category}
                </Badge>
              </div>
            </div>
            
            {/* Custom Dropdown Menu */}
            <div className="relative" ref={menuRef}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={(e) => toggleMenu(habit.id, e)}
              >
                <MoreVertical className="w-4 h-4" />
                <span className="sr-only">Abrir menú</span>
              </Button>
              
              {openMenuId === habit.id && (
                <div className="absolute right-0 top-8 z-50 w-48 bg-white rounded-md border border-gray-200 shadow-lg py-1">
                  <button
                    onClick={() => handleEdit(habit)}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleShare(habit)}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartir en comunidad
                  </button>
                  <button
                    onClick={() => handleDelete(habit)}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1>Mis Hábitos</h1>
          <p className="text-gray-600">
            {completedHabits.length} de {habits.length} completados hoy
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Progress Overview */}
      {habits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progreso del día</span>
                  <span>{completionRate}%</span>
                </div>
                <Progress value={completionRate} />
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    {completionRate === 100 
                      ? '¡Perfecto! Todos los hábitos completados'
                      : completionRate >= 70 
                      ? '¡Muy bien! Sigue así'
                      : 'Puedes completar más hábitos hoy'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pending Habits */}
      {pendingHabits.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-gray-600">Pendientes ({pendingHabits.length})</h2>
          <div className="space-y-3">
            {pendingHabits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Habits */}
      {completedHabits.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-gray-600">Completados ({completedHabits.length})</h2>
          <div className="space-y-3">
            {completedHabits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} isCompleted />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {habits.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="mb-2">No tienes hábitos aún</h3>
          <p className="text-gray-600 mb-4">
            Comienza agregando tu primer hábito
          </p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Hábito
          </Button>
        </motion.div>
      )}

      {/* Dialogs */}
      <AddHabitDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      
      <EditHabitDialog 
        open={showEditDialog} 
        onOpenChange={handleEditDialogClose}
        habit={selectedHabit}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={handleDeleteDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El hábito "{selectedHabit?.title}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}