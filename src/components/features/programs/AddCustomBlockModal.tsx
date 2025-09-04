'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Users, MapPin } from 'lucide-react';

interface AddCustomBlockModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (title: string, durationMinutes: number) => void;
}

export function AddCustomBlockModal({ open, onClose, onAdd }: AddCustomBlockModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [location, setLocation] = useState('');
  const [participants, setParticipants] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    const totalMinutes = durationHours * 60 + durationMinutes;
    onAdd(title.trim(), totalMinutes);
    
    // Reset form
    setTitle('');
    setDescription('');
    setDurationHours(0);
    setDurationMinutes(30);
    setLocation('');
    setParticipants('');
  };

  const handleClose = () => {
    // Reset form on close
    setTitle('');
    setDescription('');
    setDurationHours(0);
    setDurationMinutes(30);
    setLocation('');
    setParticipants('');
    onClose();
  };

  const isValid = title.trim().length > 0 && (durationHours > 0 || durationMinutes > 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Block</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Block Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Break, Lunch, Free Time"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this block..."
              rows={3}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration *</Label>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="hours" className="text-sm text-muted-foreground">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  max="24"
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
                  className="text-center"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="minutes" className="text-sm text-muted-foreground">Minutes</Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                  className="text-center"
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Total: {durationHours > 0 ? `${durationHours}h ` : ''}{durationMinutes > 0 ? `${durationMinutes}min` : ''}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Main Hall, Outside, Kitchen"
                className="pl-10"
              />
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label htmlFor="participants">Participants (Optional)</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="participants"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="e.g., All scouts, Leaders only, Small groups"
                className="pl-10"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              Add Block
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
