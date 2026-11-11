
export type DeliveryEntry = {
  id: string;
  date: string;
  orders: number;
  earnings: number;
  distance: number;
  onlineHours: number;
  tips: number;
  incentive: number;
  manualExpenses: number;
  notes?: string;
  fuelCost: number;
  netProfit: number;
};

export type UserSettings = {
  petrolPrice: number;
  mileage: number;
  dailyGoal: number;
  autoFuelCalc: boolean;
};
