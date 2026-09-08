'use client';

import { useActivity } from '@/hooks/useActivity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Clock, Users, Target, MapPin, BookOpen, Star, MessageSquare, Plus } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ActivityRating } from './ActivityRating';
import { AddToProgramModal } from './AddToProgramModal';
import { SuggestEditForm } from './SuggestEditForm';
import { useState } from 'react';
import { useLocale } from '@/components/locale/LocaleProvider';
import { enumLabel } from '@/lib/locale/labels';

interface ActivityDetailProps {
  activityId: string;
}

export function ActivityDetail({ activityId }: ActivityDetailProps) {
  const { t } = useLocale();
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
        <h1 className="text-2xl font-bold text-red-600 mb-4">{t('activities.loadError')}</h1>
        <p className="text-muted-foreground">{error || t('activities.notFound')}</p>
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
                <p>{t('activities.noImage')}</p>
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
              <span className="text-sm">{enumLabel(t, 'groupSize', activity.group_size)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{enumLabel(t, 'effort', activity.effort_level)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{enumLabel(t, 'location', activity.location)}</span>
            </div>
          </div>

          {/* Age Group */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{enumLabel(t, 'ageGroup', activity.age_group)}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={() => setShowAddToProgramModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('programs.addToProgram')}
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
              {t('activities.goals')}
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

      {activity.challenges && activity.challenges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t('activities.challenges')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.challenges.map((challenge) => (
                <div key={challenge.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {challenge.type?.name}
                    </Badge>
                  </div>
                  <h4 className="font-medium mb-1">{challenge.name}</h4>
                  {challenge.description && (
                    <p className="text-sm text-muted-foreground">
                      {challenge.description}
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
              {t('activities.sdgs')}
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

      <SuggestEditForm activityId={activity.id} />

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
