'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Trash2, Edit3, Target } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Goal {
  id: string;
  text: string;
  completed: boolean;
}

const initialGoals: Goal[] = [
  { id: '1', text: 'Practice mindfulness for 10 minutes daily', completed: true },
  { id: '2', text: 'Identify 3 positive affirmations each morning', completed: false },
  { id: '3', text: 'Journal about feelings twice a week', completed: false },
];

export function GoalManager() {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [newGoalText, setNewGoalText] = useState('');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalText, setEditingGoalText] = useState('');

  const handleAddGoal = () => {
    if (newGoalText.trim()) {
      setGoals([...goals, { id: crypto.randomUUID(), text: newGoalText.trim(), completed: false }]);
      setNewGoalText('');
    }
  };

  const toggleGoalCompletion = (id: string) => {
    setGoals(goals.map(goal => goal.id === id ? { ...goal, completed: !goal.completed } : goal));
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditingGoalText(goal.text);
  };

  const handleSaveEdit = () => {
    if (editingGoalId && editingGoalText.trim()) {
      setGoals(goals.map(goal => goal.id === editingGoalId ? { ...goal, text: editingGoalText.trim() } : goal));
      setEditingGoalId(null);
      setEditingGoalText('');
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Manage Your Goals
        </CardTitle>
        <CardDescription>Set, track, and achieve your personal wellbeing goals.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-6">
          <Input
            type="text"
            placeholder="Enter a new goal..."
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
          />
          <Button onClick={handleAddGoal} aria-label="Add new goal">
            <PlusCircle className="h-5 w-5 mr-2" /> Add Goal
          </Button>
        </div>

        <ScrollArea className="h-[300px] pr-3">
          {goals.length === 0 ? (
            <p className="text-center text-muted-foreground">No goals set yet. Add one above!</p>
          ) : (
            <ul className="space-y-3">
              {goals.map((goal) => (
                <li
                  key={goal.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors"
                >
                  {editingGoalId === goal.id ? (
                    <div className="flex-grow flex items-center space-x-2">
                      <Input 
                        value={editingGoalText} 
                        onChange={(e) => setEditingGoalText(e.target.value)}
                        className="flex-grow"
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                      />
                      <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingGoalId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3 flex-grow">
                        <Checkbox
                          id={`goal-${goal.id}`}
                          checked={goal.completed}
                          onCheckedChange={() => toggleGoalCompletion(goal.id)}
                          aria-labelledby={`goal-text-${goal.id}`}
                        />
                        <label
                          id={`goal-text-${goal.id}`}
                          htmlFor={`goal-${goal.id}`}
                          className={`flex-grow text-sm cursor-pointer ${goal.completed ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {goal.text}
                        </label>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditGoal(goal)} aria-label={`Edit goal: ${goal.text}`}>
                          <Edit3 className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal.id)} aria-label={`Delete goal: ${goal.text}`}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
