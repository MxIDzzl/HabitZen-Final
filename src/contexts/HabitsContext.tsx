import React, { createContext, useContext, useState, useEffect } from 'react';
import { Habit, Friend, FriendRequest, SearchUser } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface HabitDay {
  date: string; // YYYY-MM-DD format
  completedHabits: string[];
  allHabits: string[];
}

interface CommunityPost {
  id: string;
  habitId: string;
  habitTitle: string;
  habitDescription: string;
  habitCategory: string;
  userId: string;
  username: string;
  userAvatar?: string;
  userRole?: string;
  userVerified?: boolean;
  streak: number;
  timestamp: Date;
  likes: string[]; // array of user IDs who liked
  comments: Array<{
    id: string;
    userId: string;
    username: string;
    content: string;
    timestamp: Date;
  }>;
}

interface HabitsContextType {
  habits: Habit[];
  habitHistory: HabitDay[];
  communityPosts: CommunityPost[];
  friends: Friend[];
  friendRequests: FriendRequest[];
  addHabit: (title: string, description: string, category: string) => Promise<void>;
  editHabit: (habitId: string, title: string, description: string, category: string) => Promise<void>;
  completeHabit: (habitId: string) => Promise<void>;
  uncompleteHabit: (habitId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  shareHabitToCommunity: (habitId: string) => void;
  likePost: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
  getCurrentStreak: () => number;
  getBestStreak: () => number;
  getCompletedDaysThisMonth: () => Set<string>;
  getDailyCompletionRate: () => number;
  searchUsers: (query: string) => Promise<SearchUser[]>;
  sendFriendRequest: (toUserId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  isLoading: boolean;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

export function HabitsProvider({ children }: { children: React.ReactNode}) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitHistory, setHabitHistory] = useState<HabitDay[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const { user, accessToken } = useAuth();

  // Función para obtener la fecha de hoy en formato YYYY-MM-DD
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Load habits and completions when user logs in
  useEffect(() => {
    if (user && accessToken) {
      loadHabits();
      loadCompletions();
      loadStats();
      loadCommunityPosts();
    } else {
      // Clear data on logout
      setHabits([]);
      setHabitHistory([]);
      setCommunityPosts([]);
    }
  }, [user, accessToken]);

  const loadHabits = async () => {
    if (!accessToken || !user) return;

    try {
      setIsLoading(true);
      
      const userId = user.id;
      
      // Get habits from database
      const { data: fetchedHabits, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (habitsError) {
        console.error('Error loading habits:', habitsError);
        setIsLoading(false);
        return;
      }
      
      // Get today's completions to mark habits as completed
      const today = getTodayString();
      const { data: completions, error: completionsError } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today); // Cambiar de 'completion_date' a 'date'

      if (completionsError) {
        console.error('Error loading completions:', completionsError);
      }
      
      const completedHabitIds = new Set(completions?.map((c: any) => c.habit_id) || []);
      
      // Map database habits to our Habit type
      const mappedHabits: Habit[] = (fetchedHabits || []).map((h: any) => ({
        id: h.id,
        title: h.name || h.title, // Soportar tanto 'name' como 'title'
        description: h.description || '',
        category: h.category || 'general', // Valor por defecto si no existe
        streak: 0, // Will be calculated from completions
        isCompleted: completedHabitIds.has(h.id),
        completedAt: completedHabitIds.has(h.id) ? new Date() : undefined,
        createdAt: new Date(h.created_at),
        userId: h.user_id,
      }));

      setHabits(mappedHabits);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompletions = async () => {
    if (!accessToken || !user) return;

    try {
      const userId = user.id;
      
      // Load last 90 days of completions
      const today = new Date();
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(today.getDate() - 90);

      const { data: completions, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', ninetyDaysAgo.toISOString().split('T')[0]) // Cambiar 'completion_date' a 'date'
        .lte('date', today.toISOString().split('T')[0]); // Cambiar 'completion_date' a 'date'

      if (error) {
        console.error('Error loading completions:', error);
        return;
      }

      // Group completions by date
      const completionsByDate: Record<string, string[]> = {};
      
      (completions || []).forEach((c: any) => {
        const date = c.date || c.completion_date; // Soportar ambas columnas
        if (!completionsByDate[date]) {
          completionsByDate[date] = [];
        }
        completionsByDate[date].push(c.habit_id);
      });

      // Create habit history
      const history: HabitDay[] = Object.keys(completionsByDate).map(date => ({
        date,
        completedHabits: completionsByDate[date],
        allHabits: habits.map(h => h.id), // This is approximate
      }));

      setHabitHistory(history);
      
      // Calculate streaks
      await calculateStreaks(completions || []);
    } catch (error) {
      console.error('Error loading completions:', error);
    }
  };

  const calculateStreaks = async (completions: any[]) => {
    if (completions.length === 0) {
      setCurrentStreak(0);
      setBestStreak(0);
      await updateUserStreaksInDB(0, 0);
      return;
    }

    // Sort completions by date - soportar ambas columnas
    const sortedDates = completions
      .map(c => c.date || c.completion_date)
      .sort()
      .reverse();

    const uniqueDates = Array.from(new Set(sortedDates));

    // Calculate current streak
    let current = 0;
    const today = getTodayString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (uniqueDates.includes(today) || uniqueDates.includes(yesterdayStr)) {
      current = 1;
      const startDate = uniqueDates.includes(today) ? today : yesterdayStr;
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() - 1);
      
      while (true) {
        const checkDateStr = checkDate.toISOString().split('T')[0];
        
        if (uniqueDates.includes(checkDateStr)) {
          current++;
        } else {
          break;
        }
      }
    }

    setCurrentStreak(current);
    
    // Calculate best streak
    let best = 0;
    let temp = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diff === 1) {
        temp++;
      } else {
        best = Math.max(best, temp);
        temp = 1;
      }
    }
    best = Math.max(best, temp, current);

    setBestStreak(best);
    
    // Update Supabase
    await updateUserStreaksInDB(current, best);
  };

  const updateUserStreaksInDB = async (current: number, best: number) => {
    if (!user) return;

    try {
      console.log(`📊 Actualizando rachas en DB: current=${current}, best=${best}`);
      
      const { error } = await supabase
        .from('users')
        .update({ 
          current_streak: current,
          best_streak: Math.max(best, current)
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating streaks:', error);
      } else {
        console.log('✅ Rachas actualizadas en Supabase');
      }
    } catch (error) {
      console.error('Error updating user streaks:', error);
    }
  };

  const loadStats = async () => {
    // Stats are now calculated locally from completions
    // No need for backend API call
  };

  const addHabit = async (title: string, description: string, category: string) => {
    if (!accessToken || !user) return;
    
    try {
      setIsLoading(true);
      
      const userId = user.id;
      
      const habitData = {
        user_id: userId,
        name: title, // La tabla usa 'name', no 'title'
        description: description || ''
      };

      console.log('📝 Creando hábito:', habitData);

      const { data: habit, error: habitError } = await supabase
        .from('habits')
        .insert([habitData])
        .select()
        .single();

      if (habitError) {
        console.error('❌ Error creando hábito:', habitError);
        
        // Mensaje específico para RLS
        if (habitError.message.includes('row-level security') || habitError.code === '42501') {
          throw new Error(
            '❌ ERROR DE SEGURIDAD (RLS)\n\n' +
            'Debes ejecutar el SQL para desactivar RLS.\n\n' +
            '🔧 SOLUCIÓN:\n' +
            '1. Abre: https://supabase.com/dashboard/project/sxjnlaoumttaglgbcyww/sql/new\n' +
            '2. Copia y ejecuta el SQL del archivo: EJECUTAR_ESTE_SQL.sql\n' +
            '3. Recarga la app y vuelve a intentar'
          );
        }
        
        throw new Error(habitError.message || 'Failed to create habit');
      }

      console.log('✅ Hábito creado exitosamente:', habit);
      
      const newHabit: Habit = {
        id: habit.id,
        title: habit.name || title,
        description: habit.description || '',
        category: category || 'general',
        streak: 0,
        isCompleted: false,
        createdAt: new Date(habit.created_at),
        userId: habit.user_id,
      };
      
      setHabits(prev => [...prev, newHabit]);
    } catch (error) {
      console.error('Error adding habit:', error);
      
      // Mostrar alert con instrucciones
      if (error instanceof Error && error.message.includes('RLS')) {
        alert(error.message);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const editHabit = async (habitId: string, title: string, description: string, category: string) => {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      const userId = user.id;
      
      // Solo actualizar campos que existen en el schema
      const { error } = await supabase
        .from('habits')
        .update({ name: title, description })
        .eq('id', habitId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error editing habit:', error);
        throw error;
      }
      
      // Actualizar en memoria local con category incluido
      setHabits(prev => prev.map(habit => 
        habit.id === habitId 
          ? { ...habit, title, description, category }
          : habit
      ));
    } catch (error) {
      console.error('Error editing habit:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeHabit = async (habitId: string) => {
    if (!accessToken) return;

    try {
      const today = getTodayString();
      const userId = user.id;
      
      const { error} = await supabase
        .from('habit_completions')
        .insert([{ habit_id: habitId, user_id: userId, date: today }]); // Cambiar completion_date a date

      if (error) {
        console.error('Error completing habit:', error);
        throw error;
      }
      
      setHabits(prev => prev.map(habit => 
        habit.id === habitId 
          ? { 
              ...habit, 
              isCompleted: true, 
              completedAt: new Date(),
            }
          : habit
      ));

      // Reload stats to update streak
      loadStats();
    } catch (error) {
      console.error('Error completing habit:', error);
      throw error;
    }
  };

  const uncompleteHabit = async (habitId: string) => {
    if (!accessToken) return;

    try {
      const today = getTodayString();
      const userId = user.id;
      
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .eq('date', today); // Cambiar completion_date a date

      if (error) {
        console.error('Error uncompleting habit:', error);
        throw error;
      }
      
      setHabits(prev => prev.map(habit => 
        habit.id === habitId 
          ? { 
              ...habit, 
              isCompleted: false, 
              completedAt: undefined,
            }
          : habit
      ));

      // Reload stats to update streak
      loadStats();
    } catch (error) {
      console.error('Error uncompleting habit:', error);
      throw error;
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      const userId = user.id;
      
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting habit:', error);
        throw error;
      }
      
      setHabits(prev => prev.filter(habit => habit.id !== habitId));
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const shareHabitToCommunity = async (habitId: string) => {
    if (!user) return;
    
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    try {
      const userId = user.id;

      // Guardar post en la base de datos (SOLO CAMPOS QUE EXISTEN)
      const postData = {
        user_id: userId,
        habit_id: habit.id,
        habit_title: habit.title,
        username: user.username,
        streak: currentStreak
      };

      console.log('📤 Compartiendo hábito a la comunidad:', postData);

      const { data: savedPost, error } = await supabase
        .from('community_posts')
        .insert([postData])
        .select()
        .single();

      if (error) {
        console.error('Error sharing to community:', error);
        
        // Mostrar error al usuario
        if (error.message.includes('relation "community_posts" does not exist')) {
          alert(
            '❌ ERROR: Tabla de comunidad no existe\n\n' +
            '🔧 SOLUCIÓN:\n' +
            '1. Abre: https://supabase.com/dashboard/project/sxjnlaoumttaglgbcyww/sql/new\n' +
            '2. Ejecuta el SQL del archivo: CREAR_TABLAS_COMUNIDAD.sql\n' +
            '3. Recarga la app y vuelve a intentar'
          );
        } else {
          alert(
            '❌ ERROR al compartir: ' + error.message + '\n\n' +
            '🔧 SOLUCIÓN:\n' +
            '1. Elimina las tablas viejas\n' +
            '2. Ejecuta el SQL actualizado: CREAR_TABLAS_COMUNIDAD.sql\n'
          );
        }
        throw error;
      }

      console.log('✅ Post compartido exitosamente:', savedPost);

      // Agregar a la lista local (usar datos del hábito local para campos faltantes)
      const newPost: CommunityPost = {
        id: savedPost.id,
        habitId: savedPost.habit_id,
        habitTitle: savedPost.habit_title,
        habitDescription: habit.description || '', // Desde hábito local
        habitCategory: habit.category, // Desde hábito local
        userId: savedPost.user_id,
        username: savedPost.username,
        userAvatar: user.avatar, // Desde usuario local
        streak: savedPost.streak || 0,
        timestamp: new Date(savedPost.created_at),
        likes: [],
        comments: []
      };

      setCommunityPosts(prev => [newPost, ...prev]);
    } catch (error) {
      console.error('Error sharing habit to community:', error);
    }
  };

  const likePost = async (postId: string) => {
    if (!user) return;

    try {
      const userId = user.id;
      const post = communityPosts.find(p => p.id === postId);
      if (!post) return;

      const isLiked = post.likes.includes(userId);

      if (isLiked) {
        // Quitar like
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        if (error) {
          console.error('Error unliking post:', error);
          return;
        }

        console.log('👎 Like removido');
      } else {
        // Agregar like
        const { error } = await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: userId }]);

        if (error) {
          console.error('Error liking post:', error);
          return;
        }

        console.log('👍 Like agregado');
      }

      // Actualizar estado local
      setCommunityPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likes: isLiked 
              ? p.likes.filter(id => id !== userId)
              : [...p.likes, userId]
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) return;

    try {
      const userId = user.id;

      // Guardar comentario en la base de datos
      const commentData = {
        post_id: postId,
        user_id: userId,
        username: user.username,
        content
      };

      console.log('💬 Agregando comentario:', commentData);

      const { data: savedComment, error } = await supabase
        .from('post_comments')
        .insert([commentData])
        .select()
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        return;
      }

      console.log('✅ Comentario agregado:', savedComment);

      // Actualizar estado local
      const newComment = {
        id: savedComment.id,
        userId: savedComment.user_id,
        username: savedComment.username,
        content: savedComment.content,
        timestamp: new Date(savedComment.created_at)
      };

      setCommunityPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, newComment]
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const getCurrentStreak = () => {
    return currentStreak;
  };

  const getBestStreak = () => {
    return bestStreak;
  };

  const getCompletedDaysThisMonth = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const completedDays = new Set<string>();
    
    habitHistory.forEach(day => {
      const dayDate = new Date(day.date);
      if (
        dayDate.getMonth() === currentMonth &&
        dayDate.getFullYear() === currentYear &&
        day.completedHabits.length > 0
      ) {
        completedDays.add(day.date);
      }
    });
    
    return completedDays;
  };

  const getDailyCompletionRate = () => {
    const today = getTodayString();
    const todayData = habitHistory.find(day => day.date === today);
    
    if (!todayData || habits.length === 0) {
      // Calculate from current habits state
      const completed = habits.filter(h => h.isCompleted).length;
      const total = habits.length;
      return total > 0 ? Math.round((completed / total) * 100) : 0;
    }
    
    return Math.round((todayData.completedHabits.length / habits.length) * 100);
  };

  const loadCommunityPosts = async () => {
    if (!accessToken || !user) return;

    try {
      // Cargar todos los posts de la comunidad (de todos los usuarios)
      const { data: posts, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50); // Últimos 50 posts

      if (postsError) {
        console.error('Error loading community posts:', postsError);
        return;
      }

      if (!posts || posts.length === 0) {
        setCommunityPosts([]);
        return;
      }

      // Obtener IDs únicos de usuarios que postearon
      const userIds = Array.from(new Set(posts.map(p => p.user_id)));

      // Cargar información de los usuarios
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, avatar, role, is_verified')
        .in('id', userIds);

      if (usersError) {
        console.error('Error loading users:', usersError);
      }

      // Crear mapa de usuarios por ID
      const usersMap: Record<string, any> = {};
      (users || []).forEach((u: any) => {
        usersMap[u.id] = u;
      });

      // Cargar likes para todos los posts
      const postIds = posts.map(p => p.id);
      const { data: likes, error: likesError } = await supabase
        .from('post_likes')
        .select('*')
        .in('post_id', postIds);

      if (likesError) {
        console.error('Error loading likes:', likesError);
      }

      // Cargar comentarios para todos los posts
      const { data: comments, error: commentsError } = await supabase
        .from('post_comments')
        .select('*')
        .in('post_id', postIds)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error loading comments:', commentsError);
      }

      // Agrupar likes por post
      const likesByPost: Record<string, string[]> = {};
      (likes || []).forEach((like: any) => {
        if (!likesByPost[like.post_id]) {
          likesByPost[like.post_id] = [];
        }
        likesByPost[like.post_id].push(like.user_id);
      });

      // Agrupar comentarios por post
      const commentsByPost: Record<string, any[]> = {};
      (comments || []).forEach((comment: any) => {
        if (!commentsByPost[comment.post_id]) {
          commentsByPost[comment.post_id] = [];
        }
        commentsByPost[comment.post_id].push({
          id: comment.id,
          userId: comment.user_id,
          username: comment.username,
          content: comment.content,
          timestamp: new Date(comment.created_at)
        });
      });

      // Map database posts to our CommunityPost type
      const mappedPosts: CommunityPost[] = posts.map((p: any) => {
        const userData = usersMap[p.user_id] || {};
        return {
          id: p.id,
          habitId: p.habit_id,
          habitTitle: p.habit_title,
          habitDescription: '', // No está en DB, usar vacío
          habitCategory: 'general', // No está en DB, usar por defecto
          userId: p.user_id,
          username: p.username,
          userAvatar: userData.avatar || '', // Desde la tabla users
          userRole: userData.role || 'user', // Desde la tabla users
          userVerified: userData.is_verified || false, // Desde la tabla users
          streak: p.streak || 0,
          timestamp: new Date(p.created_at),
          likes: likesByPost[p.id] || [],
          comments: commentsByPost[p.id] || []
        };
      });

      setCommunityPosts(mappedPosts);
    } catch (error) {
      console.error('Error loading community posts:', error);
    }
  };

  // 👥 FUNCIONES DE AMIGOS

  const searchUsers = async (query: string): Promise<SearchUser[]> => {
    if (!query.trim()) return [];
    if (!user) return [];

    try {
      console.log('🔍 Buscando usuarios con query:', query);
      
      // Buscar usuarios por username (excluyendo al usuario actual)
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', `%${query}%`)
        .neq('id', user.id) // Excluir al usuario actual
        .limit(20);

      if (error) {
        console.error('❌ Error searching users:', error);
        return [];
      }

      console.log('✅ Usuarios encontrados:', users);

      return (users || []).map((u: any) => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        currentStreak: u.current_streak || 0,
        isOnline: u.is_online || false
      }));
    } catch (error) {
      console.error('❌ Error searching users:', error);
      return [];
    }
  };

  const sendFriendRequest = async (toUserId: string) => {
    if (!user) return;

    try {
      const fromUserId = user.id;

      // Verificar si ya existe una solicitud
      const { data: existing } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('from_user_id', fromUserId)
        .eq('to_user_id', toUserId)
        .single();

      if (existing) {
        console.log('Ya existe una solicitud pendiente');
        return;
      }

      // Crear solicitud
      const requestData = {
        from_user_id: fromUserId,
        to_user_id: toUserId,
        from_username: user.username,
        from_avatar: user.avatar,
        status: 'pending'
      };

      const { error } = await supabase
        .from('friend_requests')
        .insert([requestData]);

      if (error) {
        console.error('Error sending friend request:', error);
        throw error;
      }

      console.log('✅ Solicitud de amistad enviada');
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    if (!user) return;

    try {
      const userId = user.id;

      // Obtener la solicitud
      const { data: request, error: fetchError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        console.error('Error fetching request:', fetchError);
        return;
      }

      // Crear amistad bidireccional
      const friendships = [
        { user_id: request.from_user_id, friend_id: request.to_user_id },
        { user_id: request.to_user_id, friend_id: request.from_user_id }
      ];

      const { error: friendshipError } = await supabase
        .from('friendships')
        .insert(friendships);

      if (friendshipError) {
        console.error('Error creating friendship:', friendshipError);
        return;
      }

      // Actualizar estado de solicitud
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating request:', updateError);
      }

      // Remover de la lista local
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));

      console.log('✅ Solicitud aceptada');
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      // Actualizar estado de solicitud
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting request:', error);
        return;
      }

      // Remover de la lista local
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));

      console.log('❌ Solicitud rechazada');
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return;

    try {
      const userId = user.id;

      // Eliminar ambas direcciones de la amistad
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

      if (error) {
        console.error('Error removing friend:', error);
        return;
      }

      // Actualizar lista local
      setFriends(prev => prev.filter(f => f.id !== friendId));

      console.log('🗑️ Amigo removido');
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  return (
    <HabitsContext.Provider value={{ 
      habits, 
      habitHistory,
      communityPosts,
      friends,
      friendRequests,
      addHabit,
      editHabit,
      completeHabit, 
      uncompleteHabit, 
      deleteHabit,
      shareHabitToCommunity,
      likePost,
      addComment,
      getCurrentStreak,
      getBestStreak,
      getCompletedDaysThisMonth,
      getDailyCompletionRate,
      searchUsers,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      removeFriend,
      isLoading
    }}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitsContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return context;
}