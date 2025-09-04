'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity } from '@/drizzle/schema/activities';
import { useActivities } from '@/hooks/useActivities';
import { Search, Filter, Clock, MapPin, Users, Target } from 'lucide-react';

interface AddActivityModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (activity: Activity) => void;
  programId: string;
}

export function AddActivityModal({ open, onClose, onAdd, programId }: AddActivityModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const { data: activities, isLoading } = useActivities();

  const filteredActivities = useMemo(() => {
    if (!activities) return [];

    return activities.filter(activity => {
      const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === 'all' || activity.activity_type === selectedType;
      const matchesLocation = selectedLocation === 'all' || activity.location === selectedLocation;

      return matchesSearch && matchesType && matchesLocation;
    });
  }, [activities, searchTerm, selectedType, selectedLocation]);

  const activityTypes = useMemo(() => {
    if (!activities) return [];
    const types = [...new Set(activities.map(a => a.activity_type).filter(Boolean))];
    return types.sort();
  }, [activities]);

  const locations = useMemo(() => {
    if (!activities) return [];
    const locs = [...new Set(activities.map(a => a.location).filter(Boolean))];
    return locs.sort();
  }, [activities]);

  const handleAddActivity = (activity: Activity) => {
    onAdd(activity);
    onClose();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Activity to Program</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="type-filter">Activity Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger id="type-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {activityTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Label htmlFor="location-filter">Location</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger id="location-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Activities List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading activities...
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No activities found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredActivities.map(activity => (
                <div
                  key={activity.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleAddActivity(activity)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-lg">{activity.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(activity.duration_minutes || 30)}</span>
                        </div>
                        
                        {activity.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{activity.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{activity.min_participants}-{activity.max_participants}</span>
                        </div>
                      </div>

                      {activity.educational_goals && activity.educational_goals.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {activity.educational_goals.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddActivity(activity);
                      }}
                    >
                      Add to Program
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
