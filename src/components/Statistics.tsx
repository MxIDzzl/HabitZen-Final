import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { useHabits } from '../contexts/HabitsContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { Calendar as CalendarIcon, TrendingUp, Flame, Target } from 'lucide-react';

export function Statistics() {
  const { 
    habits, 
    habitHistory, 
    getCurrentStreak, 
    getBestStreak, 
    getCompletedDaysThisMonth,
    getDailyCompletionRate 
  } = useHabits();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Generar datos para el gráfico de barras semanal basado en el historial real
  const generateWeeklyData = () => {
    const today = new Date();
    const weeklyData = [];
    const dayNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayData = habitHistory.find(day => day.date === dateString);
      const percentage = dayData && dayData.allHabits.length > 0 
        ? Math.round((dayData.completedHabits.length / dayData.allHabits.length) * 100)
        : 0;
      
      weeklyData.push({
        day: dayNames[date.getDay()],
        completed: dayData?.completedHabits.length || 0,
        total: dayData?.allHabits.length || 0,
        percentage
      });
    }
    
    return weeklyData;
  };

  const weeklyData = generateWeeklyData();
  const currentStreak = getCurrentStreak();
  const bestStreak = getBestStreak();
  const completedDaysThisMonth = getCompletedDaysThisMonth();
  const averageCompletion = getDailyCompletionRate();

  // Obtener color para las barras según el porcentaje
  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return '#10b981'; // green-500
    if (percentage >= 70) return '#f59e0b'; // amber-500
    if (percentage >= 50) return '#ef4444'; // red-500
    return '#6b7280'; // gray-500
  };

  // Estadísticas mensuales
  const monthlyStats = {
    totalDays: new Date().getDate(), // Días transcurridos del mes actual
    completedDays: completedDaysThisMonth.size,
    averageCompletion,
    bestStreak,
    currentStreak
  };

  const modifiers = {
    completed: (date: Date) => {
      const dateString = date.toISOString().split('T')[0];
      return completedDaysThisMonth.has(dateString);
    },
  };

  const modifiersStyles = {
    completed: {
      backgroundColor: '#10b981',
      color: 'white',
      fontWeight: 'bold',
    },
  };

  // Generar consejos personalizados
  const generateTips = () => {
    const tips = [];
    
    // Análisis de días de la semana
    const worstDay = weeklyData.reduce((prev, current) => 
      (prev.percentage < current.percentage) ? prev : current
    );
    
    const bestDay = weeklyData.reduce((prev, current) => 
      (prev.percentage > current.percentage) ? prev : current
    );

    if (worstDay.percentage < 50) {
      const dayName = {
        'D': 'domingos', 'L': 'lunes', 'M': 'martes', 'X': 'miércoles',
        'J': 'jueves', 'V': 'viernes', 'S': 'sábados'
      }[worstDay.day];
      tips.push(`• Los ${dayName} son tu día más difícil (${worstDay.percentage}%)`);
    }

    if (currentStreak > 0 && currentStreak < bestStreak) {
      tips.push(`• ¡Solo te faltan ${bestStreak - currentStreak + 1} días para tu nuevo récord!`);
    }

    if (averageCompletion >= 80) {
      tips.push(`• ¡Excelente consistencia! Mantén este ritmo`);
    } else if (averageCompletion >= 60) {
      tips.push(`• Buen progreso, puedes mejorar un poco más`);
    } else {
      tips.push(`• Intenta ser más consistente con tus hábitos diarios`);
    }

    return tips;
  };

  const tips = generateTips();

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1>Estadísticas</h1>
        <p className="text-gray-600">Analiza tu progreso y consistencia</p>
      </motion.div>

      {/* Resumen Mensual */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Resumen del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{monthlyStats.averageCompletion}%</p>
                <p className="text-sm text-gray-600">Promedio</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{monthlyStats.completedDays}</p>
                <p className="text-sm text-gray-600">Días Activos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{monthlyStats.currentStreak}</p>
                <p className="text-sm text-gray-600">Racha Actual</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{monthlyStats.bestStreak}</p>
                <p className="text-sm text-gray-600">Mejor Racha</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Gráfico de Rendimiento Semanal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento Semanal</CardTitle>
            <p className="text-sm text-gray-600">Porcentaje de hábitos completados por día</p>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Excelente (90%+)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-amber-500 rounded"></div>
                  <span>Bueno (70%+)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Regular (50%+)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendario de Hábitos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Calendario de Progreso
            </CardTitle>
            <p className="text-sm text-gray-600">Días donde completaste al menos un hábito</p>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border w-full"
            />
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">Día completado</span>
              </div>
              <Badge variant="secondary">
                {completedDaysThisMonth.size} días activos este mes
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Análisis de Rachas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Flame className="w-5 h-5 mr-2 text-orange-500" />
              Análisis de Rachas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <div>
                <p className="font-medium">Racha Actual</p>
                <p className="text-sm text-gray-600">Días consecutivos activos</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">{currentStreak}</p>
                <p className="text-sm text-gray-600">días</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="font-medium">Mejor Racha</p>
                <p className="text-sm text-gray-600">Tu récord personal</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">{bestStreak}</p>
                <p className="text-sm text-gray-600">días</p>
              </div>
            </div>

            <div className="pt-3 border-t">
              <h4 className="font-medium mb-2">Consejos para mejorar</h4>
              <div className="space-y-1 text-sm text-gray-600">
                {tips.map((tip, index) => (
                  <p key={index}>{tip}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}