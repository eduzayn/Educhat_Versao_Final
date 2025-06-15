import { useState } from 'react';

const initialFormState = {
  title: '',
  type: '',
  description: '',
  date: '',
  time: '',
  contact: '',
  priority: 'medium',
};

export function useActivityForm() {
  const [activityForm, setActivityForm] = useState(initialFormState);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  const startEdit = (activity: any) => {
    setEditingActivity(activity);
    setActivityForm({
      title: activity.title,
      type: activity.type,
      description: activity.description,
      date: activity.date,
      time: activity.time,
      contact: activity.contact,
      priority: activity.priority,
    });
    setIsEditDialogOpen(true);
  };

  const startCreate = () => {
    setActivityForm(initialFormState);
    setEditingActivity(null);
    setIsNewDialogOpen(true);
  };

  const resetForm = () => {
    setActivityForm(initialFormState);
    setEditingActivity(null);
    setIsEditDialogOpen(false);
    setIsNewDialogOpen(false);
  };

  return {
    activityForm,
    setActivityForm,
    editingActivity,
    setEditingActivity,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isNewDialogOpen,
    setIsNewDialogOpen,
    startEdit,
    startCreate,
    resetForm,
  };
} 