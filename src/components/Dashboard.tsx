import React from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';
import { useHabits } from '../contexts/HabitsContext';
import { Calendar, Flame, Target, Trophy } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const { 
    habits, 
    getCurrentStreak, 
    getDailyCompletionRate,
    getCompletedDaysThisMonth 
  } = useHabits();

  const completedToday = habits.filter(h => h.isCompleted).length;
  const totalHabits = habits.length;
  const progressPercentage = getDailyCompletionRate();
  const currentStreak = getCurrentStreak();
  const completedDaysThisMonth = getCompletedDaysThisMonth().size;

  const stats = [
    {
      icon: Target,
      label: 'Hábitos Hoy',
      value: `${completedToday}/${totalHabits}`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Flame,
      label: 'Racha Actual',
      value: currentStreak,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Calendar,
      label: 'Días Activos',
      value: completedDaysThisMonth,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Trophy,
      label: 'Logros',
      value: '3',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1>¡Hola, {user?.username}!</h1>
        <p className="text-gray-600">Veamos tu progreso de hoy</p>
      </motion.div>

      {/* Progress Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
          <CardHeader>
            <CardTitle className="text-white">Progreso Diario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Hábitos completados</span>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {completedToday}/{totalHabits}
                </Badge>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-sm text-white/90">
                {progressPercentage === 100 
                  ? '¡Excelente! Completaste todos tus hábitos hoy'
                  : `${progressPercentage}% completado - ¡Sigue así!`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-xl font-semibold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Completaste "Ejercicio" hace 2 horas</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Alcanzaste {currentStreak} días de racha</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">Has sido activo {completedDaysThisMonth} días este mes</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}