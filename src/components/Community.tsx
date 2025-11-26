import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Heart, MessageCircle, Flame, Send, TrendingUp } from 'lucide-react';
import { useHabits } from '../contexts/HabitsContext';
import { useAuth } from '../contexts/AuthContext';
import { RoleBadge } from './RoleBadge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function Community() {
  const { communityPosts, likePost, addComment } = useHabits();
  const { user } = useAuth();
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

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

  const handleLike = (postId: string) => {
    likePost(postId);
  };

  const handleComment = (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    addComment(postId, content);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const isLiked = (post: any) => {
    return user && post.likes.includes(user.id);
  };

  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: es 
    });
  };

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1>Comunidad</h1>
        <p className="text-gray-600">Comparte y descubre hábitos inspiradores</p>
      </motion.div>

      {/* Community Stats */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{communityPosts.length}</p>
                <p className="text-sm text-gray-600">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">4.2k</p>
                <p className="text-sm text-gray-600">Miembros</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">89%</p>
                <p className="text-sm text-gray-600">Activos hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {communityPosts.length > 0 ? (
          communityPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.userAvatar} />
                        <AvatarFallback>
                          {post.username.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-1">
                          <p className="font-medium">{post.username}</p>
                          {(post.userRole || post.userVerified) && (
                            <RoleBadge role={post.userRole} isVerified={post.userVerified} size="sm" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatTimeAgo(post.timestamp)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={getCategoryColor(post.habitCategory)}>
                      {post.habitCategory}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="mb-4">
                    <h3 className="font-medium mb-1">{post.habitTitle}</h3>
                    <p className="text-sm text-gray-600 mb-3">{post.habitDescription}</p>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge variant="outline" className="flex items-center">
                        <Flame className="w-3 h-3 mr-1 text-orange-500" />
                        {post.streak} días de racha
                      </Badge>
                      <Badge variant="outline">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Compartido
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-1 ${
                          isLiked(post) ? 'text-red-500' : 'text-gray-600'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked(post) ? 'fill-current' : ''}`} />
                        <span>{post.likes.length}</span>
                      </Button>
                      
                      <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments.length}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Comments */}
                  {post.comments.length > 0 && (
                    <div className="mt-4 space-y-3 border-t pt-3">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {comment.username.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                              <p className="text-sm font-medium">{comment.username}</p>
                              <p className="text-sm">{comment.content}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimeAgo(comment.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="mt-3 flex space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="text-xs">
                        {user?.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex space-x-2">
                      <Input
                        placeholder="Escribe un comentario..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({
                          ...prev,
                          [post.id]: e.target.value
                        }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleComment(post.id);
                          }
                        }}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                      >
                        <Send className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="mb-2">¡Sé el primero en compartir!</h3>
            <p className="text-gray-600 mb-4">
              Comparte tus hábitos desde "Mis Hábitos" para inspirar a la comunidad
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}