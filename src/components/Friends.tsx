import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { UserPlus, Flame, Users, Crown, Target, Trophy, Bell, Check, X } from 'lucide-react';
import { useHabits } from '../contexts/HabitsContext';
import { Friend, FriendRequest } from '../types';
import { AddFriendDialog } from './AddFriendDialog';
import { CreateChallengeDialog } from './CreateChallengeDialog';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export function Friends() {
  const { getCurrentStreak, acceptFriendRequest, rejectFriendRequest } = useHabits();
  const { user } = useAuth();
  const myStreak = getCurrentStreak();
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [showAddFriendDialog, setShowAddFriendDialog] = useState(false);
  const [showCreateChallengeDialog, setShowCreateChallengeDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar amigos reales desde Supabase
  useEffect(() => {
    if (user) {
      loadFriends();
      loadPendingRequests();
      loadChallenges();
    }
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;

    try {
      console.log('🔄 Cargando amigos para usuario:', user.id);
      
      // Obtener IDs de amigos desde friendships
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id);

      if (friendshipsError) {
        console.error('Error loading friendships:', friendshipsError);
        setFriends([]);
        setIsLoading(false);
        return;
      }

      if (!friendships || friendships.length === 0) {
        console.log('✅ No hay amigos aún');
        setFriends([]);
        setIsLoading(false);
        return;
      }

      const friendIds = friendships.map(f => f.friend_id);
      console.log('👥 IDs de amigos:', friendIds);

      // Obtener información de los amigos
      const { data: friendsData, error: friendsError } = await supabase
        .from('users')
        .select('*')
        .in('id', friendIds);

      if (friendsError) {
        console.error('Error loading friends data:', friendsError);
        setFriends([]);
        setIsLoading(false);
        return;
      }

      const loadedFriends: Friend[] = (friendsData || []).map(f => ({
        id: f.id,
        username: f.username,
        avatar: f.avatar,
        streak: f.current_streak || 0,
        isOnline: f.is_online || false
      }));

      console.log('✅ Amigos cargados:', loadedFriends);
      setFriends(loadedFriends);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading friends:', error);
      setFriends([]);
      setIsLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    if (!user) return;

    try {
      console.log('🔔 Cargando solicitudes pendientes para:', user.id);
      
      const { data: requests, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading friend requests:', error);
        setPendingRequests([]);
        return;
      }

      const formattedRequests: FriendRequest[] = (requests || []).map(r => ({
        id: r.id,
        fromUserId: r.from_user_id,
        toUserId: r.to_user_id,
        fromUsername: r.from_username,
        fromAvatar: r.from_avatar,
        status: r.status,
        createdAt: new Date(r.created_at)
      }));

      console.log('✅ Solicitudes pendientes:', formattedRequests);
      setPendingRequests(formattedRequests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      setPendingRequests([]);
    }
  };

  const loadChallenges = async () => {
    if (!user) return;

    try {
      console.log('🏆 Cargando desafíos para usuario:', user.id);
      
      // Obtener desafíos donde el usuario es participante
      const { data: participations, error: participationsError } = await supabase
        .from('challenge_participants')
        .select('challenge_id')
        .eq('user_id', user.id);

      if (participationsError) {
        console.error('Error loading participations:', participationsError);
        setChallenges([]);
        return;
      }

      if (!participations || participations.length === 0) {
        console.log('✅ No hay desafíos aún');
        setChallenges([]);
        return;
      }

      const challengeIds = participations.map(p => p.challenge_id);

      // Obtener información de los desafíos
      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .in('id', challengeIds)
        .order('created_at', { ascending: false });

      if (challengesError) {
        console.error('Error loading challenges:', challengesError);
        setChallenges([]);
        return;
      }

      // Para cada desafío, obtener los participantes
      const challengesWithParticipants = await Promise.all(
        (challengesData || []).map(async (challenge) => {
          const { data: participants } = await supabase
            .from('challenge_participants')
            .select('user_id')
            .eq('challenge_id', challenge.id);

          return {
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            duration: challenge.duration,
            participants: participants?.map(p => p.user_id) || [],
            isPrivate: challenge.is_private,
            createdAt: new Date(challenge.created_at),
            startDate: new Date(challenge.start_date),
            endDate: new Date(challenge.end_date),
            progress: {}
          };
        })
      );

      console.log('✅ Desafíos cargados:', challengesWithParticipants);
      setChallenges(challengesWithParticipants);
    } catch (error) {
      console.error('Error loading challenges:', error);
      setChallenges([]);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      toast.success('¡Solicitud aceptada!');
      // Recargar amigos y solicitudes
      loadFriends();
      loadPendingRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Error al aceptar solicitud');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      toast.success('Solicitud rechazada');
      loadPendingRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Error al rechazar solicitud');
    }
  };

  const handleFriendAdded = (newFriend: Friend) => {
    setFriends(prev => [...prev, newFriend]);
  };

  const handleChallengeCreated = (newChallenge: any) => {
    setChallenges(prev => [newChallenge, ...prev]);
  };

  // Agregar al usuario actual a la lista para el ranking
  const allUsers = [
    {
      id: 'me',
      username: 'Tú',
      avatar: '',
      streak: myStreak,
      isOnline: true,
      isCurrentUser: true
    },
    ...friends
  ];

  const topStreak = Math.max(...allUsers.map(f => f.streak));

  const getDaysRemaining = (endDate: Date) => {
    const today = new Date();
    const diff = endDate.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const getParticipantNames = (participantIds: string[]) => {
    return participantIds.map(id => {
      const friend = friends.find(f => f.id === id);
      return friend ? friend.username : 'Usuario';
    }).join(', ');
  };
  
  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1>Amigos</h1>
          <p className="text-gray-600">Compite y motívate con tus amigos</p>
        </div>
        <Button size="sm" onClick={() => setShowAddFriendDialog(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{friends.length}</p>
              <p className="text-sm text-gray-600">Amigos</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4 text-center">
              <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{topStreak}</p>
              <p className="text-sm text-gray-600">Mejor Racha</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pending Friend Requests */}
      {pendingRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-purple-500" />
                  Solicitudes Pendientes
                </span>
                <Badge variant="secondary">{pendingRequests.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={request.fromAvatar} />
                      <AvatarFallback>
                        {request.fromUsername.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.fromUsername}</p>
                      <p className="text-sm text-gray-600">
                        Quiere ser tu amigo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleAcceptRequest(request.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Crown className="w-5 h-5 mr-2 text-yellow-500" />
              Ranking de Rachas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {allUsers
              .sort((a, b) => b.streak - a.streak)
              .map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    friend.isCurrentUser ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${
                      index === 0 ? 'bg-yellow-200 text-yellow-800' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-200 text-orange-800' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    {friend.avatar ? (
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback>
                          {friend.username.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-medium">Tú</span>
                      </div>
                    )}
                    <div>
                      <p className={`font-medium ${friend.isCurrentUser ? 'text-purple-700' : ''}`}>
                        {friend.username}
                      </p>
                      <div className="flex items-center space-x-2">
                        {friend.isOnline && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                        <span className="text-sm text-gray-600">
                          {friend.isCurrentUser ? 'Tu racha actual' :
                           friend.isOnline ? 'En línea' : 'Desconectado'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex items-center">
                    <Flame className="w-4 h-4 mr-1 text-orange-500" />
                    {friend.streak}
                  </Badge>
                </motion.div>
              ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Challenges Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                Desafíos
              </CardTitle>
              <Button 
                size="sm" 
                onClick={() => setShowCreateChallengeDialog(true)}
                disabled={friends.length === 0}
              >
                <Target className="w-4 h-4 mr-2" />
                Crear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {challenges.length > 0 ? (
              challenges.map((challenge) => (
                <div key={challenge.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{challenge.title}</h4>
                    <Badge variant={getDaysRemaining(challenge.endDate) > 0 ? 'default' : 'secondary'}>
                      {getDaysRemaining(challenge.endDate) > 0 
                        ? `${getDaysRemaining(challenge.endDate)} días restantes`
                        : 'Finalizado'
                      }
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {challenge.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex -space-x-2">
                        {challenge.participants.slice(0, 3).map((participantId: string) => {
                          const participant = friends.find(f => f.id === participantId);
                          return participant ? (
                            <Avatar key={participant.id} className="w-6 h-6 border-2 border-white">
                              <AvatarImage src={participant.avatar} />
                              <AvatarFallback className="text-xs">
                                {participant.username.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          ) : null;
                        })}
                        {challenge.participants.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{challenge.participants.length - 3}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">
                        {getParticipantNames(challenge.participants.slice(0, 2))}
                        {challenge.participants.length > 2 && ` +${challenge.participants.length - 2} más`}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 mb-2">No hay desafíos activos</p>
                <p className="text-sm text-gray-500 mb-4">
                  {friends.length === 0 
                    ? 'Agrega amigos primero para crear desafíos'
                    : 'Crea un desafío para competir con tus amigos'
                  }
                </p>
                {friends.length > 0 && (
                  <Button onClick={() => setShowCreateChallengeDialog(true)}>
                    <Target className="w-4 h-4 mr-2" />
                    Crear Primer Desafío
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <AddFriendDialog 
        open={showAddFriendDialog} 
        onOpenChange={setShowAddFriendDialog}
        onFriendAdded={handleFriendAdded}
      />
      
      <CreateChallengeDialog 
        open={showCreateChallengeDialog} 
        onOpenChange={setShowCreateChallengeDialog}
        friends={friends}
        onChallengeCreated={handleChallengeCreated}
      />
    </div>
  );
}