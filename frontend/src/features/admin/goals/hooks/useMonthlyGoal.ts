import { useState, useCallback } from 'react';

const MONTHLY_GOAL_KEY = 'allmart_monthly_goal';
const DEFAULT_GOAL = 500000;

export function useMonthlyGoal() {
  const [monthlyGoal, setMonthlyGoalState] = useState(() => {
    const saved = localStorage.getItem(MONTHLY_GOAL_KEY);
    return saved ? Number(saved) : DEFAULT_GOAL;
  });

  const setMonthlyGoal = useCallback((value: number) => {
    setMonthlyGoalState(value);
    localStorage.setItem(MONTHLY_GOAL_KEY, String(value));
  }, []);

  return { monthlyGoal, setMonthlyGoal };
}
