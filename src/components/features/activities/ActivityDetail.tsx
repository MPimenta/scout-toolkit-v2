'use client';

import { useActivity } from '@/hooks/useActivity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Users, Target, MapPin, BookOpen, Star, MessageSquare, Plus } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ActivityRating } from './ActivityRating';
import { AddToProgramModal } from './AddToProgramModal';
import { useState } from 'react';

interface ActivityDetailProps {
  activityId: string;
}

// Helper function to get age group display text
function getAgeGroupText(ageGroup: string): string {
  const ageMap = {
    cub_scouts: 'Lobitos (6-10)',
    scouts: 'Escoteiros (10-14)',
    adventurers: 'Exploradores (14-17)',
    rovers: 'Caminheiros (17-21)',
    leaders: 'Dirigentes (21+)',
  };
  return ageMap[ageGroup as keyof typeof ageMap] || ageGroup;
}

// Helper function to get group size display text
function getGroupSizeText(groupSize: string): string {
  const sizeMap = {
    small: 'Pequeno (2-5)',
    medium: 'Médio (6-15)',
    large: 'Grande (16+)',
  };
  return sizeMap[groupSize as keyof typeof sizeMap] || groupSize;
}

// Helper function to get effort level display text
function getEffortLevelText(effortLevel: string): string {
  const effortMap = {
    low: 'Baixo',
    medium: 'Médio',
    high: 'Alto',
  };
  return effortMap[effortLevel as keyof typeof effortMap] || effortLevel;
}

// Helper function to get location display text
function getLocationText(location: string): string {
  const locationMap = {
    inside: 'Interior',
    outside: 'Exterior',
  };
  return locationMap[location as keyof typeof locationMap] || location;
}

export function ActivityDetail({ activityId }: ActivityDetailProps) {
  const { activity, loading, error } = useActivity(activityId);
  const [showAddToProgramModal, setShowAddToProgramModal] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar atividade</h1>
        <p className="text-muted-foreground">{error || 'Atividade não encontrada'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Activity Image */}
        <div className="lg:w-1/3">
          {activity.image_url ? (
            <img
              src={activity.image_url}
              alt={activity.name}
              className="w-full h-64 object-cover rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <BookOpen className="h-16 w-16 mx-auto mb-2" />
                <p>Sem imagem</p>
              </div>
            </div>
          )}
        </div>

        {/* Activity Info */}
        <div className="lg:w-2/3 space-y-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{activity.name}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {activity.description}
            </p>
          </div>

          {/* Activity Type */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {activity.activity_type.name}
            </Badge>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{activity.approximate_duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{getGroupSizeText(activity.group_size)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{getEffortLevelText(activity.effort_level)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{getLocationText(activity.location)}</span>
            </div>
          </div>

          {/* Age Group */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{getAgeGroupText(activity.age_group)}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={() => setShowAddToProgramModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar ao Programa
            </Button>
            <Button variant="outline">
              <Star className="h-4 w-4 mr-2" />
              Avaliar
            </Button>
          </div>
        </div>
      </div>

      {/* Materials Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Materiais Necessários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {activity.materials}
          </p>
        </CardContent>
      </Card>

      {/* Educational Goals Section */}
      {activity.educational_goals && activity.educational_goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objetivos Educativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.educational_goals.map((goal) => (
                <div key={goal.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {goal.area.name} • {goal.area.code}
                    </Badge>
                  </div>
                  <h4 className="font-medium mb-1">{goal.title}</h4>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground">
                      {goal.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SDGs Section */}
      {activity.sdgs && activity.sdgs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objetivos de Desenvolvimento Sustentável (ODS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activity.sdgs.map((sdg) => (
                <div key={sdg.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {sdg.icon_url && (
                      <img
                        src={sdg.icon_url}
                        alt={`ODS ${sdg.number}`}
                        className="w-6 h-6"
                      />
                    )}
                    <span className="font-medium">
                      {sdg.number}. {sdg.name}
                    </span>
                  </div>
                  {sdg.description && (
                    <p className="text-sm text-muted-foreground">
                      {sdg.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityRating activityId={activity.id} />
        </CardContent>
      </Card>

      {/* Add to Program Modal */}
      {showAddToProgramModal && (
        <AddToProgramModal
          activity={activity}
          onClose={() => setShowAddToProgramModal(false)}
        />
      )}
    </div>
  );
}
